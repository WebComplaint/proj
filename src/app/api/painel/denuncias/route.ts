import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requirePainelSession } from "@/lib/server-auth";
import { painelDenunciasQuerySchema } from "@/lib/validacoes";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = painelDenunciasQuerySchema.parse(Object.fromEntries(searchParams));
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
      anonima: query.tipo === "anonima" ? true : query.tipo === "identificada" ? false : undefined,
      criadoEm:
        query.inicio || query.fim
          ? {
              gte: query.inicio ? new Date(query.inicio) : undefined,
              lte: query.fim ? new Date(`${query.fim}T23:59:59.999`) : undefined
            }
          : undefined
    };
    const skip = (query.pagina - 1) * PAGE_SIZE;
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
