/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Entrega a lista de denuncias para o painel, ja filtrada e paginada.
 *
 * A primeira linha da funcao exige login. Sem isso a rota nem comeca a
 * trabalhar e devolve erro 401.
 *
 * Depois ela monta a busca no banco a partir dos filtros recebidos e devolve
 * 20 registros por vez, junto com o total de paginas.
 *
 * Para a apresentacao: e a lista do painel vista pelo lado do servidor.
 */

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requirePainelSession } from "@/lib/server-auth";
import { painelDenunciasQuerySchema } from "@/lib/validacoes";

// BLOCO 1 - Quantos casos vem por pagina.
// Trazer as milhares de denuncias de uma vez deixaria a tela lenta e gastaria
// dados do celular de quem esta acessando.
const PAGE_SIZE = 20;

export async function GET(request: Request) {
  // BLOCO 2 - A PORTA TRANCADA. Antes de qualquer outra coisa, exige login.
  // Se nao houver cracha valido, devolve o erro e a funcao acaba aqui.
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // BLOCO 3 - Le os filtros que vieram no endereco da pagina.
    // Em /api/painel/denuncias?status=RECEBIDA&pagina=2, o sistema le
    // status = RECEBIDA e pagina = 2. Depois confere se cada um e valido.
    const { searchParams } = new URL(request.url);
    const query = painelDenunciasQuerySchema.parse(Object.fromEntries(searchParams));

    // BLOCO 4 - Monta o "filtro de busca" que sera entregue ao banco.
    // A palavra undefined aqui significa "nao filtre por isso". Ou seja, cada
    // filtro que a equipe deixou em branco simplesmente e ignorado, e a lista
    // vem mais ampla.
    const where: Prisma.DenunciaWhereInput = {
      status: query.status,
      prioridade: query.prioridade,
      categoria: query.categoria ? { slug: query.categoria } : undefined,
      responsavelId: query.responsavelId || undefined,
      protocolo: query.protocolo
        ? {
            contains: query.protocolo
          }
        : undefined,
      // Traduz a escolha da equipe para verdadeiro/falso. Sem escolha, mostra
      // os dois tipos.
      anonima: query.tipo === "anonima" ? true : query.tipo === "identificada" ? false : undefined,

      // Filtro por periodo. O detalhe do T23:59:59.999 e importante: sem ele,
      // "ate dia 20" significaria "ate a meia-noite do dia 20", e as denuncias
      // feitas durante o dia 20 ficariam de fora do relatorio.
      criadoEm:
        query.inicio || query.fim
          ? {
              gte: query.inicio ? new Date(query.inicio) : undefined,
              lte: query.fim ? new Date(`${query.fim}T23:59:59.999`) : undefined
            }
          : undefined
    };

    // BLOCO 5 - Calcula quantos registros pular para chegar na pagina pedida.
    // Pagina 1 pula 0; pagina 2 pula 20; pagina 3 pula 40, e assim por diante.
    const skip = (query.pagina - 1) * PAGE_SIZE;

    // BLOCO 6 - Faz as duas consultas ao mesmo tempo:
    // quantos casos existem no total (para calcular as paginas) e quais sao os
    // 20 casos desta pagina.
    const [total, denuncias] = await Promise.all([
      prisma.denuncia.count({ where }),
      prisma.denuncia.findMany({
        where,
        orderBy:
          query.ordenarPor === "prioridade"
            ? [{ prioridade: query.direcao }, { criadoEm: "desc" }]
            : [{ criadoEm: query.direcao }],
        skip,
        take: PAGE_SIZE,
        // Nesta LISTA, o texto do relato nao e trazido. A tela so mostra
        // protocolo, categoria, status, prioridade e responsavel. O conteudo
        // da denuncia so sai do banco quando alguem abre o caso especifico.
        select: {
          id: true,
          protocolo: true,
          status: true,
          prioridade: true,
          anonima: true,
          criadoEm: true,
          categoria: {
            select: {
              nome: true,
              slug: true
            }
          },
          responsavel: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      })
    ]);

    // BLOCO 7 - Devolve a lista mais os dados de paginacao.
    // O Math.ceil arredonda para cima: 21 casos dao 2 paginas, e nao 1,05.
    // O Math.max(1, ...) garante que a tela sempre mostre "pagina 1 de 1",
    // mesmo quando nao ha nenhum resultado.
    return NextResponse.json({
      denuncias,
      paginacao: {
        total,
        pagina: query.pagina,
        porPagina: PAGE_SIZE,
        totalPaginas: Math.max(1, Math.ceil(total / PAGE_SIZE))
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível listar as denúncias agora." }, { status: 500 });
  }
}
