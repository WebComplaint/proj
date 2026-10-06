/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Monta todos os numeros que aparecem na tela inicial do painel da escola.
 *
 * Ele calcula, de uma vez so:
 *   - quantas denuncias entraram no mes;
 *   - quantas ainda esperam triagem, quantas estao em andamento e resolvidas;
 *   - quais casos estao ATRASADOS (parados ha mais de 48 horas);
 *   - o total por categoria e o total por mes dos ultimos 6 meses;
 *   - as 5 denuncias mais recentes.
 *
 * Todas essas contas sao pedidas ao banco AO MESMO TEMPO, e nao uma depois
 * da outra. Por isso o painel abre rapido mesmo com muitos registros.
 *
 * Para a apresentacao: e o cerebro por tras dos graficos e dos cartoes.
 */

import { subMonths, startOfMonthKey, toMonthKey } from "@/lib/date-utils";
import { isTriagemAtrasada } from "@/lib/denuncias";
import { prisma } from "@/lib/prisma";

export async function getDashboardData(now = new Date()) {
  // BLOCO 1 - Define o recorte de tempo das contas.
  // currentMonthStart = dia 1 do mes atual, para o indicador "total do mes".
  // sixMonthsStart    = dia 1 de cinco meses atras, o inicio do grafico.
  // monthKeys         = as 6 etiquetas de mes do grafico, em ordem.
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthKeys = Array.from({ length: 6 }, (_, index) => startOfMonthKey(subMonths(now, 5 - index)));

  // BLOCO 2 - Faz as 8 perguntas ao banco DE UMA VEZ SO.
  // O Promise.all e a parte importante: ele dispara as 8 consultas em paralelo
  // e espera todas terminarem juntas. Uma depois da outra, o painel demoraria
  // a soma dos tempos; assim ele demora apenas o tempo da mais lenta.
  const [
    totalMes,
    aguardandoTriagem,
    emAndamento,
    resolvidas,
    recebidas,
    porCategoria,
    denunciasPeriodo,
    recentes
  ] = await Promise.all([
    // PERGUNTA 1 - Quantas denuncias entraram do dia 1 deste mes para ca?
    // "gte" quer dizer "maior ou igual a".
    prisma.denuncia.count({
      where: {
        criadoEm: {
          gte: currentMonthStart
        }
      }
    }),
    // PERGUNTA 2 - Quantas ainda estao esperando triagem?
    prisma.denuncia.count({
      where: {
        status: "RECEBIDA"
      }
    }),
    // PERGUNTA 3 - Quantas estao sendo tratadas agora?
    prisma.denuncia.count({
      where: {
        status: "EM_ANDAMENTO"
      }
    }),
    // PERGUNTA 4 - Quantas ja foram resolvidas?
    prisma.denuncia.count({
      where: {
        status: "RESOLVIDA"
      }
    }),
    // PERGUNTA 5 - Traga a lista das que esperam triagem, da mais antiga para
    // a mais nova. Sera usada logo abaixo para descobrir quais passaram do
    // prazo de 48 horas.
    prisma.denuncia.findMany({
      where: {
        status: "RECEBIDA"
      },
      select: {
        id: true,
        protocolo: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        criadoEm: "asc"
      }
    }),
    // PERGUNTA 6 - Agrupe as denuncias por categoria e conte cada grupo.
    // E o proprio banco que faz essa soma, o que e muito mais rapido do que
    // trazer todos os registros e contar aqui. Alimenta o grafico de barras.
    prisma.denuncia.groupBy({
      by: ["categoriaId"],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          categoriaId: "desc"
        }
      }
    }),
    // PERGUNTA 7 - Traga as datas das denuncias dos ultimos 6 meses.
    // Repare no "select": ele pede SOMENTE a data de criacao, e nada mais.
    // Para desenhar o grafico de linha nao e preciso o texto do relato nem os
    // dados do denunciante, entao eles nem saem do banco.
    prisma.denuncia.findMany({
      where: {
        criadoEm: {
          gte: sixMonthsStart
        }
      },
      select: {
        criadoEm: true
      }
    }),
    // PERGUNTA 8 - Traga as 5 denuncias mais recentes para o rodape do painel.
    // "take: 5" limita a cinco, "orderBy desc" ordena da mais nova para a mais
    // antiga.
    prisma.denuncia.findMany({
      take: 5,
      orderBy: {
        criadoEm: "desc"
      },
      select: {
        id: true,
        protocolo: true,
        status: true,
        prioridade: true,
        anonima: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true
          }
        },
        responsavel: {
          select: {
            nome: true
          }
        }
      }
    })
  ]);

  // BLOCO 3 - Descobre o NOME das categorias contadas na pergunta 6.
  // Aquela contagem devolveu codigos internos, e nao nomes. Aqui o sistema
  // busca os nomes correspondentes em uma unica consulta, e nao uma consulta
  // por categoria.
  const categorias = await prisma.categoria.findMany({
    where: {
      id: {
        in: porCategoria.map((item) => item.categoriaId)
      }
    },
    select: {
      id: true,
      nome: true
    }
  });

  // BLOCO 4 - Monta um dicionario "codigo -> nome" para consultar rapidamente.
  const categoriaNomePorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));

  // BLOCO 5 - Prepara os 6 meses do grafico, todos comecando em zero.
  // Esse detalhe importa: um mes sem nenhuma denuncia precisa aparecer no
  // grafico marcando zero. Sem isso ele sumiria e o grafico enganaria a leitura.
  const mensalMap = new Map(monthKeys.map((key) => [key, 0]));

  // BLOCO 6 - Distribui cada denuncia no mes correspondente, somando 1 a 1.
  for (const denuncia of denunciasPeriodo) {
    const key = toMonthKey(denuncia.criadoEm);
    mensalMap.set(key, (mensalMap.get(key) ?? 0) + 1);
  }

  // BLOCO 7 - Separa os casos ATRASADOS: os que estao parados em "recebida"
  // ha mais de 48 horas. Sao eles que geram o alerta vermelho no painel.
  const foraSla = recebidas.filter((denuncia) => isTriagemAtrasada("RECEBIDA", denuncia.criadoEm, now));

  // BLOCO 8 - Entrega tudo pronto para a tela apenas desenhar.
  // A pagina do painel nao faz conta nenhuma: ela so recebe estes numeros.
  return {
    indicadores: {
      totalMes,
      aguardandoTriagem,
      emAndamento,
      resolvidas
    },
    foraSla,
    porCategoria: porCategoria.map((item) => ({
      categoria: categoriaNomePorId.get(item.categoriaId) ?? "Categoria removida",
      total: item._count._all
    })),
    porMes: monthKeys.map((key) => ({
      mes: formatMonthLabel(key),
      total: mensalMap.get(key) ?? 0
    })),
    recentes
  };
}

// BLOCO 9 - Transforma a etiqueta tecnica "2026-03" no rotulo "mar/26" que
// aparece embaixo do grafico de linha.
function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit"
  }).format(new Date(year, month - 1, 1));
}
