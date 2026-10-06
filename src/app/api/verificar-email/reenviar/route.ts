/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Reenvia o link de confirmacao para o funcionario logado que ainda nao
 * confirmou o e-mail.
 *
 * Esta rota fica FORA de /api/painel de proposito: o porteiro (middleware.ts)
 * barra quem nao confirmou o e-mail, e justamente essa pessoa precisa
 * conseguir pedir um link novo.
 *
 * Para a apresentacao: e o botao "nao recebi o e-mail".
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enviarVerificacao } from "@/lib/verificacao-email";

export async function POST() {
  // BLOCO 1 - Quem esta pedindo? Precisa estar logado.
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { authUserId: data.user.id },
    select: { id: true, email: true, ativo: true, emailVerificadoEm: true }
  });

  if (!usuario?.ativo) {
    return NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 });
  }

  if (usuario.emailVerificadoEm) {
    return NextResponse.json({ erro: "Seu e-mail já está confirmado." }, { status: 400 });
  }

  // BLOCO 2 - No maximo 3 reenvios a cada 10 minutos por pessoa, para que o
  // botao nao vire uma forma de lotar a caixa de entrada de alguem.
  const rateLimit = allowRequest(`reenviar-verificacao:${usuario.id}`, 3);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: "Você já pediu vários links. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  try {
    await enviarVerificacao({ tipo: "USUARIO", usuarioId: usuario.id, email: usuario.email });
  } catch {
    return NextResponse.json({ erro: "Não foi possível enviar o e-mail agora." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
