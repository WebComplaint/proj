import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { allowRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { protocoloSchema } from "@/lib/validacoes";

type ProtocoloRouteContext = {
  params: {
    protocolo: string;
  };
};

export async function GET(request: Request, { params }: ProtocoloRouteContext) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";
  const rateLimit = allowRequest(`protocolo:${clientIp}`);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos antes de consultar novamente." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  try {
    const { protocolo } = protocoloSchema.parse({ protocolo: params.protocolo });

    const denuncia = await prisma.denuncia.findUnique({
      where: { protocolo },
      select: {
        protocolo: true,
        status: true,
        prioridade: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true,
            slug: true
          }
        },
        historico: {
          where: {
            publico: true
          },
          orderBy: {
            criadoEm: "asc"
          },
          select: {
            statusAnterior: true,
            statusNovo: true,
            comentario: true,
            criadoEm: true
          }
        }
      }
    });

    if (!denuncia) {
      return NextResponse.json(
        { erro: "Não foi possível mostrar informações para esse protocolo. Confira o código e tente novamente." },
        { status: 404 }
      );
    }

    return NextResponse.json(denuncia);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível consultar o protocolo agora." }, { status: 500 });
  }
}
