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
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = criarComentarioSchema.parse(await request.json());
    const denuncia = await prisma.denuncia.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        anonima: true,
        denuncianteEmail: true,
        protocolo: true
      }
    });

    if (!denuncia) {
      return NextResponse.json({ erro: "Denúncia não encontrada." }, { status: 404 });
    }

    const historico = await prisma.historico.create({
      data: {
        denunciaId: params.id,
        usuarioId: auth.session.user.id,
        comentario: data.comentario,
        publico: data.publico
      }
    });

    if (data.publico && !denuncia.anonima && denuncia.denuncianteEmail) {
      try {
        await notifyPublicResponse({
          to: denuncia.denuncianteEmail,
          protocolo: denuncia.protocolo,
          comentario: data.comentario
        });
      } catch (notificationError) {
        console.error("Falha ao notificar resposta pública.", notificationError);
      }
    }

    return NextResponse.json(historico, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível registrar o comentário agora." }, { status: 500 });
  }
}
