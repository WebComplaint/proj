import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { gerarProtocolo } from "@/lib/protocolo";
import { prisma } from "@/lib/prisma";
import { criarDenunciaSchema } from "@/lib/validacoes";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = criarDenunciaSchema.parse(json);

    const categoria = await prisma.categoria.findFirst({
      where: {
        slug: data.categoriaSlug,
        ativa: true
      },
      select: {
        id: true,
        prioridadePadrao: true
      }
    });

    if (!categoria) {
      return NextResponse.json(
        { erro: "Categoria não encontrada. Recarregue a página e tente novamente." },
        { status: 404 }
      );
    }

    const denuncia = await prisma.$transaction(async (tx) => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const protocolo = gerarProtocolo();
        const existente = await tx.denuncia.findUnique({
          where: { protocolo },
          select: { id: true }
        });

        if (existente) {
          continue;
        }

        return tx.denuncia.create({
          data: {
            protocolo,
            categoriaId: categoria.id,
            anonima: data.anonima,
            descricao: data.descricao,
            dataOcorrido: data.dataOcorrido ? new Date(data.dataOcorrido) : null,
            local: data.local || null,
            envolvidos: data.envolvidos || null,
            prioridade: categoria.prioridadePadrao,
            denuncianteNome: data.anonima ? null : data.denuncianteNome || null,
            denuncianteEmail: data.anonima ? null : data.denuncianteEmail,
            denuncianteTelefone: data.anonima ? null : data.denuncianteTelefone || null,
            anexos: {
              create: data.anexos.map((anexo) => ({
                arquivoUrl: anexo.arquivoUrl,
                nomeOriginal: anexo.nomeOriginal,
                tipoMime: anexo.tipoMime,
                tamanho: anexo.tamanho
              }))
            },
            historico: {
              create: {
                statusNovo: "RECEBIDA",
                comentario: "Denúncia recebida pela plataforma.",
                publico: true
              }
            }
          },
          select: {
            id: true,
            protocolo: true
          }
        });
      }

      throw new Error("Não foi possível gerar um protocolo único. Tente novamente.");
    });

    return NextResponse.json({ protocolo: denuncia.protocolo }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json(
      { erro: error instanceof Error ? error.message : "Não foi possível enviar a denúncia agora." },
      { status: 500 }
    );
  }
}
