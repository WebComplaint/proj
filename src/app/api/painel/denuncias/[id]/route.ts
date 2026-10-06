/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cuida de UMA denuncia especifica dentro do painel, e faz duas coisas:
 *
 * GET   -> devolve o caso completo: relato, anexos, historico e responsavel.
 * PATCH -> altera status, prioridade ou responsavel do caso.
 *
 * O PATCH e o mais interessante para a apresentacao, porque ele encadeia
 * quatro acoes automaticamente:
 *   1. Confere se a mudanca de status e permitida pela esteira do processo
 *      (nao da para pular de Recebida direto para Resolvida).
 *   2. Altera a denuncia.
 *   3. Grava um item no historico dizendo o que mudou e quem mudou.
 *   4. Se a denuncia for identificada, envia um e-mail avisando a pessoa.
 *
 * Os passos 2 e 3 acontecem juntos, em transacao: ou os dois sao salvos, ou
 * nenhum e. Assim nunca existe uma mudanca de status sem registro de quem
 * a fez.
 *
 * Ja o e-mail fica FORA da transacao e dentro de um try/catch. Se o servico
 * de e-mail estiver fora do ar, a denuncia continua salva. Uma falha de
 * aviso nao pode desfazer o trabalho da equipe.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { canChangeStatus } from "@/lib/denuncias";
import { notifyStatusChange } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requirePainelSession } from "@/lib/server-auth";
import { atualizarDenunciaSchema } from "@/lib/validacoes";

type DenunciaRouteContext = {
  params: {
    id: string;
  };
};

// ===================== PARTE 1: LER UMA DENUNCIA =====================
// GET = trazer as informacoes completas de um caso.
export async function GET(_request: Request, { params }: DenunciaRouteContext) {
  // Exige login antes de qualquer coisa.
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  // Busca o caso trazendo TUDO: categoria, responsavel, anexos e o historico
  // completo, incluindo as notas internas.
  // Compare com a consulta publica por protocolo, que usa uma lista curta de
  // campos. E a mesma denuncia, com dois niveis de acesso bem diferentes,
  // conforme quem esta perguntando.
  const denuncia = await prisma.denuncia.findUnique({
    where: { id: params.id },
    include: {
      categoria: true,
      responsavel: {
        select: {
          id: true,
          nome: true,
          email: true
        }
      },
      anexos: {
        orderBy: {
          criadoEm: "asc"
        }
      },
      historico: {
        orderBy: {
          criadoEm: "asc"
        },
        include: {
          usuario: {
            select: {
              nome: true
            }
          }
        }
      }
    }
  });

  if (!denuncia) {
    return NextResponse.json({ erro: "Denúncia não encontrada." }, { status: 404 });
  }

  return NextResponse.json(denuncia);
}

// ===================== PARTE 2: ATUALIZAR UMA DENUNCIA =====================
// PATCH = alterar apenas alguns campos de algo que ja existe.
// (Se fosse PUT, o significado seria substituir o registro inteiro.)
export async function PATCH(request: Request, { params }: DenunciaRouteContext) {
  // Exige login.
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // PASSO 1 - Confere os dados enviados pelo formulario da tela.
    const data = atualizarDenunciaSchema.parse(await request.json());

    // PASSO 2 - Busca a situacao ATUAL do caso.
    // Isso e necessario por dois motivos: saber de qual status ele esta saindo
    // (para validar a mudanca) e saber se ha e-mail para avisar no fim.
    const atual = await prisma.denuncia.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        anonima: true,
        denuncianteEmail: true,
        denuncianteEmailVerificadoEm: true,
        protocolo: true
      }
    });

    if (!atual) {
      return NextResponse.json({ erro: "Denúncia não encontrada." }, { status: 404 });
    }

    // PASSO 3 - A REGRA DA ESTEIRA DO PROCESSO.
    // Pergunta ao arquivo de regras se essa mudanca de status e permitida.
    // Exemplo do que e barrado aqui: pular de "Recebida" direto para
    // "Resolvida", sem ninguem ter analisado o caso.
    if (data.status && !canChangeStatus(atual.status, data.status)) {
      return NextResponse.json(
        { erro: "Mudança de status não permitida para este fluxo." },
        { status: 400 }
      );
    }

    // PASSO 4 - A GRAVACAO, em transacao (tudo ou nada).
    // Duas coisas acontecem juntas aqui: alterar a denuncia e registrar essa
    // alteracao no historico. Se a segunda falhasse sozinha, o sistema teria
    // uma mudanca de status sem registro de quem a fez, e a rastreabilidade
    // do caso estaria perdida. A transacao impede esse cenario.
    const denuncia = await prisma.$transaction(async (tx) => {
      // 4a - Altera a denuncia.
      // O undefined significa "nao mexa neste campo". Assim, quem quer mudar
      // so a prioridade nao apaga sem querer o responsavel do caso.
      const updated = await tx.denuncia.update({
        where: { id: params.id },
        data: {
          status: data.status,
          prioridade: data.prioridade,
          responsavelId: data.responsavelId === undefined ? undefined : data.responsavelId || null
        },
        select: {
          id: true,
          status: true,
          prioridade: true,
          responsavelId: true
        }
      });

      // 4b - Registra a mudanca no historico, mas SO se o status realmente
      // mudou. Salvar sem mexer no status nao suja a linha do tempo.
      //
      // Repare no que fica gravado: o status antigo, o novo, o comentario e o
      // identificador de QUEM fez a alteracao. E isso que permite a escola
      // saber depois quem tomou cada decisao sobre o caso.
      //
      // O "publico: true" significa que essa mudanca aparece para quem
      // acompanha pelo protocolo. Sem comentario escrito, o sistema gera uma
      // frase automatica para a linha do tempo nunca ficar vazia.
      if (data.status && data.status !== atual.status) {
        await tx.historico.create({
          data: {
            denunciaId: params.id,
            usuarioId: auth.session.user.id,
            statusAnterior: atual.status,
            statusNovo: data.status,
            comentario: data.comentario || `Status alterado para ${data.status}.`,
            publico: true
          }
        });
      }

      return updated;
    });

    // PASSO 5 - O AVISO POR E-MAIL, ja FORA da transacao.
    // As cinco condicoes precisam valer ao mesmo tempo: houve mudanca de
    // status, ela e diferente da anterior, a denuncia nao e anonima, existe
    // um e-mail cadastrado e esse e-mail foi confirmado pela pessoa.
    if (data.status && data.status !== atual.status && !atual.anonima && atual.denuncianteEmail && atual.denuncianteEmailVerificadoEm) {
      try {
        await notifyStatusChange({
          to: atual.denuncianteEmail,
          protocolo: atual.protocolo,
          status: data.status,
          comentario: data.comentario
        });
      } catch (notificationError) {
        // Deu erro no e-mail? Anota no registro do servidor e SEGUE EM FRENTE.
        // Esta e uma decisao de projeto importante: o trabalho ja feito pela
        // equipe nao pode ser desfeito porque um servico externo caiu. A
        // denuncia continua atualizada, so o aviso nao saiu.
        console.error("Falha ao notificar mudança de status.", notificationError);
      }
    }

    // PASSO 6 - Devolve para a tela como o caso ficou depois da alteracao.
    return NextResponse.json(denuncia);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível atualizar a denúncia agora." }, { status: 500 });
  }
}
