/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Recebe os arquivos anexados a denuncia (fotos e PDFs) e os guarda.
 *
 * Todo arquivo enviado por um desconhecido e tratado como suspeito, entao
 * passa por tres conferencias antes de ser aceito:
 *   1. A extensao precisa ser jpg, jpeg, png, webp ou pdf.
 *   2. O tipo real informado pelo navegador tambem precisa bater com a lista.
 *   3. O tamanho nao pode passar de 10 MB.
 *
 * E ha um quarto cuidado, o mais importante: o arquivo e salvo com um nome
 * novo, sorteado aleatoriamente, e nunca com o nome original. Isso impede
 * que alguem envie um arquivo com nome malicioso para sobrescrever partes
 * do sistema. O nome original fica guardado apenas como texto, para ser
 * exibido na tela.
 *
 * Para a apresentacao: e o tratamento seguro de arquivos enviados.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// BLOCO 1 - As tres regras fixas de aceitacao de arquivos.
// Note que existem DUAS listas para a mesma coisa. A primeira olha o final do
// nome do arquivo (a extensao); a segunda olha o tipo declarado pelo
// navegador. Um arquivo perigoso renomeado para "foto.jpg" passaria pela
// primeira, mas seria pego pela segunda.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

// Avisa ao Next.js que esta rota roda no servidor completo, e nao na versao
// reduzida. E necessario porque mais abaixo o codigo grava arquivos em disco.
export const runtime = "nodejs";

export async function POST(request: Request) {
  // BLOCO 2 - Retira o arquivo do pacote enviado pelo formulario.
  const formData = await request.formData();
  const file = formData.get("file");

  // Veio texto em vez de arquivo, ou nao veio nada: recusa.
  if (!(file instanceof File)) {
    return NextResponse.json({ erro: "Selecione um arquivo para enviar." }, { status: 400 });
  }

  // BLOCO 3 - Pega o final do nome do arquivo, depois do ultimo ponto.
  // O toLowerCase padroniza tudo em minusculas, para que .JPG tambem passe.
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  // CONFERENCIA 1 e 2 - A extensao E o tipo declarado precisam estar nas
  // listas. As duas condicoes valem ao mesmo tempo, e nao uma ou outra.
  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { erro: "Formato não permitido. Envie jpg, jpeg, png, webp ou pdf." },
      { status: 400 }
    );
  }

  // CONFERENCIA 3 - Tamanho. Sem esse limite, alguem poderia enviar um
  // arquivo gigantesco e lotar o disco do servidor, derrubando o site para
  // todo mundo.
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { erro: "O arquivo passa de 10 MB. Escolha um menor ou reduza a qualidade da imagem." },
      { status: 400 }
    );
  }

  // BLOCO 4 - Le o conteudo do arquivo para a memoria.
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // BLOCO 5 - Define onde e com que nome o arquivo sera salvo.
  //
  // ESTA E A PROTECAO MAIS IMPORTANTE DO ARQUIVO: o nome original e
  // DESCARTADO e substituido por um codigo sorteado (randomUUID).
  //
  // Por que isso importa? O nome do arquivo e escolhido por um desconhecido.
  // Alguem poderia enviar um arquivo chamado "../../config.js" e, sem esse
  // cuidado, o sistema tentaria grava-lo por cima de um arquivo do proprio
  // site. Com o nome sorteado, o arquivo enviado nunca escolhe onde cai.
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  // BLOCO 6 - Cria a pasta se ela ainda nao existir e grava o arquivo.
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  // BLOCO 7 - Devolve os dados do arquivo salvo.
  // O nome original volta apenas como TEXTO, para ser exibido na tela da
  // equipe. Ele nunca e usado para localizar o arquivo no disco.
  return NextResponse.json(
    {
      url: `/uploads/${fileName}`,
      nomeOriginal: file.name,
      tipoMime: file.type,
      tamanho: file.size
    },
    { status: 201 }
  );
}
