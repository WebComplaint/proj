import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const where: Prisma.DenunciaWhereInput =
    inicio || fim
      ? {
          criadoEm: {
            gte: inicio ? new Date(inicio) : undefined,
            lte: fim ? new Date(`${fim}T23:59:59.999`) : undefined
          }
        }
      : {};
  const denuncias = await prisma.denuncia.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    select: {
      protocolo: true,
      status: true,
      prioridade: true,
      anonima: true,
      criadoEm: true,
      atualizadoEm: true,
      categoria: { select: { nome: true } },
      responsavel: { select: { nome: true } }
    }
  });
  const rows = [
    ["protocolo", "categoria", "status", "prioridade", "tipo", "responsavel", "criadoEm", "atualizadoEm"],
    ...denuncias.map((denuncia) => [
      denuncia.protocolo,
      denuncia.categoria.nome,
      denuncia.status,
      denuncia.prioridade,
      denuncia.anonima ? "anonima" : "identificada",
      denuncia.responsavel?.nome ?? "",
      denuncia.criadoEm.toISOString(),
      denuncia.atualizadoEm.toISOString()
    ])
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="denuncias-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
