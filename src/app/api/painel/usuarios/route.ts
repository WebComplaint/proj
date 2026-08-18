import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { usuarioAdminSchema } from "@/lib/validacoes";
import { createAuthUser, deleteAuthUser, updateAuthUser } from "@/lib/supabase/admin";

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

    const authUser = await createAuthUser(data.email.toLowerCase(), data.senha);

    let usuario;

    try {
      usuario = await prisma.usuario.create({
        data: {
          authUserId: authUser.id,
          nome: data.nome,
          email: data.email.toLowerCase(),
          perfil: data.perfil,
          ativo: data.ativo
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true
        }
      });
    } catch (error) {
      await deleteAuthUser(authUser.id);
      throw error;
    }

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
    const atual = await prisma.usuario.findUniqueOrThrow({ where: { id: data.id } });
    await updateAuthUser(atual.authUserId, {
      email: data.email.toLowerCase(),
      password: data.senha || undefined,
      ativo: data.ativo
    });

    const usuario = await prisma.usuario.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        email: data.email.toLowerCase(),
        perfil: data.perfil,
        ativo: data.ativo
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true
      }
    });

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
