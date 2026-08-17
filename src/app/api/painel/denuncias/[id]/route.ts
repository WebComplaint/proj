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

export async function GET(_request: Request, { params }: DenunciaRouteContext) {
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

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

export async function PATCH(request: Request, { params }: DenunciaRouteContext) {
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = atualizarDenunciaSchema.parse(await request.json());
    const atual = await prisma.denuncia.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        anonima: true,
        denuncianteEmail: true,
        protocolo: true
      }
    });

    if (!atual) {
      return NextResponse.json({ erro: "Denúncia não encontrada." }, { status: 404 });
    }

    if (data.status && !canChangeStatus(atual.status, data.status)) {
      return NextResponse.json(
        { erro: "Mudança de status não permitida para este fluxo." },
        { status: 400 }
      );
    }

    const denuncia = await prisma.$transaction(async (tx) => {
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

    if (data.status && data.status !== atual.status && !atual.anonima && atual.denuncianteEmail) {
      try {
        await notifyStatusChange({
          to: atual.denuncianteEmail,
          protocolo: atual.protocolo,
          status: data.status,
          comentario: data.comentario
        });
      } catch (notificationError) {
        console.error("Falha ao notificar mudança de status.", notificationError);
      }
    }

    return NextResponse.json(denuncia);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível atualizar a denúncia agora." }, { status: 500 });
  }
}
