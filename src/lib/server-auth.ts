/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Responde a pergunta "quem e a pessoa que esta fazendo este pedido?" e
 * barra quem nao deveria estar ali.
 *
 * Sao tres funcoes, do mais permissivo ao mais restrito:
 *   getPainelSession     -> descobre quem esta logado (ou responde ninguem).
 *   requirePainelSession -> exige estar logado, senao devolve erro 401.
 *   requireAdminSession  -> exige ser administrador, senao devolve erro 403.
 *
 * Repare que a checagem e feita duas vezes: aqui e tambem no porteiro
 * (middleware.ts). Isso e proposital. Se um dia alguem chamar a API por
 * fora do site, a verificacao aqui continua valendo.
 *
 * Para a apresentacao: e a conferencia de cracha em cada operacao.
 */

import type { Perfil } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin, isCoordenadorOuAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// BLOCO 1 - O "cracha" de quem esta logado.
// Repare que a senha nao esta aqui e nunca estara: o sistema so precisa saber
// quem e a pessoa e qual o cargo dela.
type PainelSession = {
  user: {
    id: string;
    authUserId: string;
    name: string;
    email: string;
    perfil: Perfil;
  };
};

// BLOCO 2 - Descobre quem esta logado neste momento.
// Devolve o cracha da pessoa, ou null (ninguem) se algo nao bater.
export async function getPainelSession() {
  // Passo 1: pergunta ao Supabase quem e o dono da sessao aberta no navegador.
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  // Se nao ha ninguem logado, para por aqui.
  if (error || !data.user) return null;

  // Passo 2: com o identificador do login em maos, busca a ficha do funcionario
  // no nosso banco. Sao dois cadastros diferentes: o Supabase guarda a senha,
  // e o nosso banco guarda o nome e o cargo dentro da escola.
  const usuario = await prisma.usuario.findUnique({
    where: { authUserId: data.user.id },
    select: { id: true, authUserId: true, nome: true, email: true, perfil: true, ativo: true, emailVerificadoEm: true }
  });

  // Passo 3: conta desativada nao entra, mesmo que a senha esteja correta.
  // E assim que a escola corta o acesso de quem saiu sem apagar o historico.
  if (!usuario?.ativo) return null;

  // Passo 3b: e-mail ainda nao confirmado tambem nao entra. Quem cuida de
  // mostrar a tela "confirme seu e-mail" e o porteiro (middleware.ts).
  if (!usuario.emailVerificadoEm) return null;

  // Passo 4: monta o cracha com os dados confirmados.
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

// BLOCO 3 - Exige que a pessoa seja da equipe da escola.
// Toda rota do painel comeca chamando esta funcao.
export async function requirePainelSession() {
  const session = await getPainelSession();

  // Sem cracha valido, devolve o erro 401.
  // Na internet, 401 significa "voce nao se identificou".
  if (!session?.user?.id || !isCoordenadorOuAdmin(session.user.perfil)) {
    return {
      session: null,
      response: NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 })
    };
  }

  // Tudo certo: devolve o cracha e nenhuma resposta de erro.
  // Quem chamou verifica se veio erro; se nao veio, segue o trabalho.
  return {
    session,
    response: null
  };
}

// BLOCO 4 - Exige que a pessoa seja administradora.
// E a trava mais forte, usada em usuarios, categorias e relatorios.
export async function requireAdminSession() {
  // Primeiro reaproveita a checagem anterior: precisa estar logado.
  const auth = await requirePainelSession();

  // Se ja falhou ali, devolve o mesmo erro sem repetir o trabalho.
  if (auth.response) {
    return auth;
  }

  // Esta logado, mas nao e administrador: devolve o erro 403.
  // A diferenca entre os dois numeros e importante:
  //   401 = "nao sei quem voce e".
  //   403 = "sei quem voce e, e voce nao pode entrar aqui".
  if (!auth.session || !isAdmin(auth.session.user.perfil)) {
    return {
      session: null,
      response: NextResponse.json({ erro: "Você não tem permissão para acessar este recurso." }, { status: 403 })
    };
  }

  return auth;
}
