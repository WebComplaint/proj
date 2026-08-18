import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { usuarioAdminSchema } from "@/lib/validacoes";

type UsuarioResult = {
  id: string;
  nome: string;
  email: string;
  perfil: "PROFESSOR" | "COORDENADOR" | "DIRETOR" | "ADMIN";
  ativo: boolean;
};

export async function GET() {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true
    }
  });

  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = usuarioAdminSchema.parse(await request.json());

    if (!data.senha) {
      return NextResponse.json(
        { erro: "Informe uma senha inicial para criar o usuário.", campos: { senha: "Informe uma senha inicial." } },
        { status: 400 }
      );
    }

    const [usuario] = await prisma.$queryRaw<UsuarioResult[]>`
      SELECT * FROM app_private.create_staff_user(
        ${data.nome},
        ${data.email.toLowerCase()},
        ${data.senha},
        CAST(${data.perfil} AS "Perfil"),
        ${data.ativo}
      )
    `;

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível criar o usuário agora." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = usuarioAdminSchema.extend({ id: usuarioAdminSchema.shape.id.unwrap() }).parse(await request.json());
    const [usuario] = await prisma.$queryRaw<UsuarioResult[]>`
      SELECT * FROM app_private.update_staff_user(
        ${data.id},
        ${data.nome},
        ${data.email.toLowerCase()},
        ${data.senha || ""},
        CAST(${data.perfil} AS "Perfil"),
        ${data.ativo}
      )
    `;

    return NextResponse.json(usuario);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível atualizar o usuário agora." }, { status: 500 });
  }
}
