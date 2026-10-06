/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Registra um comentario no historico de uma denuncia.
 *
 * O campo "publico" e a chave de tudo:
 *   publico = false -> NOTA INTERNA. So a equipe da escola ve.
 *   publico = true  -> RESPOSTA AO DENUNCIANTE. Aparece na consulta por
 *                      protocolo e, se a denuncia for identificada, tambem
 *                      dispara um e-mail.
 *
 * E o mesmo campo de texto na tela, mas o destino da mensagem muda por
 * completo. Por isso a interface pergunta isso de forma bem explicita antes
 * de salvar.
 *
 * Para a apresentacao: e o mecanismo de comunicacao com o denunciante.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { notifyPublicResponse } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requirePainelSession } from "@/lib/server-auth";
import { criarComentarioSchema } from "@/lib/validacoes";

type ComentariosRouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: ComentariosRouteContext) {
  // BLOCO 1 - Exige login. Comentario e registro oficial no caso, entao
  // precisa ter um autor identificado.
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // BLOCO 2 - Confere o texto e, principalmente, se veio a informacao de
    // que ele e interno ou publico.
    const data = criarComentarioSchema.parse(await request.json());

    // BLOCO 3 - Busca a denuncia para saber se ela e anonima e se ha e-mail.
    // Isso decide, mais abaixo, se o aviso sera enviado ou nao.
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        anonima: true,
        denuncianteEmail: true,
        denuncianteEmailVerificadoEm: true,
        protocolo: true
      }
    });

    if (!denuncia) {
      return NextResponse.json({ erro: "Denúncia não encontrada." }, { status: 404 });
    }

    // BLOCO 4 - Grava o comentario na linha do tempo do caso.
    // Ficam registrados o texto, quem escreveu e se e publico ou interno.
    // Repare que nao existe rota para APAGAR um item do historico: a linha do
    // tempo e um registro permanente do que aconteceu no caso.
    const historico = await prisma.historico.create({
      data: {
        denunciaId: params.id,
        usuarioId: auth.session.user.id,
        comentario: data.comentario,
        publico: data.publico
      }
    });

    // BLOCO 5 - O AVISO POR E-MAIL. As quatro condicoes precisam valer juntas:
    //   1. o comentario foi marcado como publico;
    //   2. a denuncia nao e anonima;
    //   3. existe um e-mail cadastrado;
    //   4. esse e-mail foi confirmado pela pessoa.
    // Uma nota interna nunca dispara e-mail, uma denuncia anonima nao tem
    // para onde enviar, e um e-mail nao confirmado pode ter sido digitado
    // errado. Por isso as quatro condicoes.
    if (data.publico && !denuncia.anonima && denuncia.denuncianteEmail && denuncia.denuncianteEmailVerificadoEm) {
      try {
        await notifyPublicResponse({
          to: denuncia.denuncianteEmail,
          protocolo: denuncia.protocolo,
          comentario: data.comentario
        });
      } catch (notificationError) {
        // Mesma decisao da rota de status: falha de e-mail nao apaga o
        // comentario ja gravado. Ela so e anotada no registro do servidor.
        console.error("Falha ao notificar resposta pública.", notificationError);
      }
    }

    // BLOCO 6 - Devolve o comentario criado. O 201 significa "criado".
    return NextResponse.json(historico, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível registrar o comentário agora." }, { status: 500 });
  }
}
