import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { usuarioAdminSchema } from "@/lib/validacoes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

    const supabase = createSupabaseAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.senha,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return NextResponse.json({ erro: authError?.message ?? "Não foi possível criar o acesso." }, { status: 400 });
    }

    let usuario;

    try {
      usuario = await prisma.usuario.create({
        data: {
          authUserId: authData.user.id,
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
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
    const supabase = createSupabaseAdminClient();
    const { error: authError } = await supabase.auth.admin.updateUserById(atual.authUserId, {
      email: data.email.toLowerCase(),
      password: data.senha || undefined,
      ban_duration: data.ativo ? "none" : "876000h"
    });

    if (authError) {
      return NextResponse.json({ erro: authError.message }, { status: 400 });
    }

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

    return NextResponse.json({ erro: "Não foi possível atualizar o usuário agora." }, { status: 500 });
  }
}
