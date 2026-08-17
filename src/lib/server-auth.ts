import type { Perfil } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin, isCoordenadorOuAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PainelSession = {
  user: {
    id: string;
    authUserId: string;
    name: string;
    email: string;
    perfil: Perfil;
  };
};

export async function getPainelSession() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { authUserId: data.user.id },
    select: { id: true, authUserId: true, nome: true, email: true, perfil: true, ativo: true }
  });

  if (!usuario?.ativo) return null;

  return {
    user: {
      id: usuario.id,
      authUserId: usuario.authUserId,
      name: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  } satisfies PainelSession;
}

export async function requirePainelSession() {
  const session = await getPainelSession();

  if (!session?.user?.id || !isCoordenadorOuAdmin(session.user.perfil)) {
    return {
      session: null,
      response: NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 })
    };
  }

  return {
    session,
    response: null
  };
}

export async function requireAdminSession() {
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth;
  }

  if (!auth.session || !isAdmin(auth.session.user.perfil)) {
    return {
      session: null,
      response: NextResponse.json({ erro: "Você não tem permissão para acessar este recurso." }, { status: 403 })
    };
  }

  return auth;
}
