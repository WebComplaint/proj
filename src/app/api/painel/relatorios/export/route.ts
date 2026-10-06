/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Gera a planilha CSV das denuncias de um periodo, que abre no Excel.
 *
 * Somente administradores podem baixar. A planilha traz protocolo,
 * categoria, status, prioridade, tipo, responsavel e datas.
 *
 * Repare no que NAO esta na lista de colunas: o texto do relato e os dados
 * pessoais do denunciante. Um arquivo baixado sai do controle do sistema
 * e pode ser reenviado por e-mail ou esquecido em um pen drive, entao ele
 * leva apenas o minimo necessario para o relatorio.
 *
 * Para a apresentacao: minimizacao de dados na pratica.
 */

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";

export async function GET(request: Request) {
  // BLOCO 1 - Exige ADMINISTRADOR, e nao apenas login.
  // Baixar uma planilha e diferente de olhar a tela: o arquivo sai do sistema
  // e passa a viver no computador de alguem, podendo ser reenviado por e-mail
  // ou esquecido em um pen drive. Por isso a trava aqui e a mais alta.
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  // BLOCO 2 - Le o periodo escolhido no endereco (inicio e fim).
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  // BLOCO 3 - Monta o filtro de datas. Sem datas informadas, exporta tudo.
  const where: Prisma.DenunciaWhereInput =
    inicio || fim
      ? {
          criadoEm: {
            gte: inicio ? new Date(inicio) : undefined,
            lte: fim ? new Date(`${fim}T23:59:59.999`) : undefined
          }
        }
      : {};
  // BLOCO 4 - Busca as denuncias do periodo.
  // A lista de campos abaixo e a mais importante deste arquivo. Ela define as
  // colunas da planilha, e o que nao esta nela nunca sai do sistema:
  // o texto do relato, os anexos e os dados pessoais do denunciante.
  // Isso e o que a LGPD chama de minimizacao de dados: leve so o necessario.
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
  // BLOCO 5 - Monta a planilha linha por linha.
  // A primeira linha e o cabecalho com os nomes das colunas; as demais sao os
  // dados. E exatamente assim que um arquivo CSV e formado: texto puro, com
  // as colunas separadas por virgula.
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
  // BLOCO 6 - Junta tudo em um texto so: virgula entre as colunas e quebra de
  // linha entre as linhas.
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  // BLOCO 7 - Devolve o texto como ARQUIVO, e nao como pagina.
  // Sao os dois cabecalhos que fazem isso:
  //   Content-Type        -> avisa que o conteudo e uma planilha CSV.
  //   Content-Disposition -> a palavra "attachment" e o que faz o navegador
  //                          baixar o arquivo em vez de exibi-lo na tela.
  // O nome do arquivo ja sai com a data do dia: denuncias-2026-09-09.csv.
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="denuncias-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

// BLOCO 8 - Protege o formato da planilha.
// Todo valor vai entre aspas, e as aspas que ja existiam no texto viram aspas
// duplas, como manda o padrao CSV. Sem esse cuidado, uma categoria com virgula
// no nome quebraria a planilha em colunas erradas ao abrir no Excel.
function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
