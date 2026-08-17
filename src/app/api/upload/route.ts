import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ erro: "Selecione um arquivo para enviar." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { erro: "Formato não permitido. Envie jpg, jpeg, png, webp ou pdf." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { erro: "O arquivo passa de 10 MB. Escolha um menor ou reduza a qualidade da imagem." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

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
