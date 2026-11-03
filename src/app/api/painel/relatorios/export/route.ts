/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Gera a planilha do Excel (.xlsx) com as denuncias de um periodo.
 *
 * Somente administradores podem baixar. A planilha traz protocolo,
 * categoria, status, prioridade, tipo, responsavel e datas, ja escritos em
 * portugues ("Em análise", e nao EM_ANALISE) e com as datas no horario de
 * Brasilia.
 *
 * Repare no que NAO esta na lista de colunas: o texto do relato e os dados
 * pessoais do denunciante. Um arquivo baixado sai do controle do sistema
 * e pode ser reenviado por e-mail ou esquecido em um pen drive, entao ele
 * leva apenas o minimo necessario para o relatorio.
 *
 * Para a apresentacao: minimizacao de dados na pratica.
 */

import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prioridadeLabelMap, statusLabelMap } from "@/lib/denuncias";
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

  // BLOCO 5 - Monta a planilha.
  // Cada coluna tem um titulo em portugues e uma largura que cabe o conteudo.
  // As datas entram como DATA de verdade, e nao como texto: assim o Excel
  // consegue ordenar e filtrar por data normalmente.
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Web Complaint";
  workbook.created = new Date();

  const planilha = workbook.addWorksheet("Denúncias", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  planilha.columns = [
    { header: "Protocolo", key: "protocolo", width: 20 },
    { header: "Categoria", key: "categoria", width: 28 },
    { header: "Status", key: "status", width: 16 },
    { header: "Prioridade", key: "prioridade", width: 12 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Responsável", key: "responsavel", width: 28 },
    { header: "Criada em", key: "criadoEm", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Atualizada em", key: "atualizadoEm", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } }
  ];

  for (const denuncia of denuncias) {
    planilha.addRow({
      protocolo: denuncia.protocolo,
      categoria: denuncia.categoria.nome,
      status: statusLabelMap[denuncia.status],
      prioridade: prioridadeLabelMap[denuncia.prioridade],
      tipo: denuncia.anonima ? "Anônima" : "Identificada",
      responsavel: denuncia.responsavel?.nome ?? "Sem responsável",
      criadoEm: horarioDeBrasilia(denuncia.criadoEm),
      atualizadoEm: horarioDeBrasilia(denuncia.atualizadoEm)
    });
  }

  // A primeira linha (os titulos) fica em negrito e ganha o botao de filtro
  // do Excel em cada coluna.
  planilha.getRow(1).font = { bold: true };
  planilha.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: planilha.columns.length } };

  const arquivo = await workbook.xlsx.writeBuffer();

  // BLOCO 6 - Devolve a planilha como ARQUIVO, e nao como pagina.
  // Sao os dois cabecalhos que fazem isso:
  //   Content-Type        -> avisa que o conteudo e uma planilha do Excel.
  //   Content-Disposition -> a palavra "attachment" e o que faz o navegador
  //                          baixar o arquivo em vez de exibi-lo na tela.
  // O nome do arquivo ja sai com a data do dia: denuncias-2026-09-09.xlsx.
  return new NextResponse(arquivo as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="denuncias-${new Date().toISOString().slice(0, 10)}.xlsx"`
    }
  });
}

// BLOCO 7 - Ajusta o horario para o de Brasilia.
// A planilha do Excel nao guarda fuso horario: ela mostra a hora exatamente
// como foi escrita. Como o servidor trabalha no horario de Londres (UTC), uma
// denuncia das 14h apareceria como 17h. Aqui a data e reescrita com a hora
// de Sao Paulo antes de entrar na planilha.
function horarioDeBrasilia(data: Date) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(data)
      .map((parte) => [parte.type, parte.value])
  );

  return new Date(
    Date.UTC(
      Number(partes.year),
      Number(partes.month) - 1,
      Number(partes.day),
      Number(partes.hour),
      Number(partes.minute),
      Number(partes.second)
    )
  );
}
