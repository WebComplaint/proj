/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Recebe o codigo do link de confirmacao e marca o e-mail como confirmado.
 *
 * Por que a confirmacao e um POST (um clique no botao) e nao acontece so de
 * abrir o link? Alguns servicos de e-mail "abrem" os links sozinhos para
 * checar se sao perigosos. Se abrir ja confirmasse, um robo poderia confirmar
 * um e-mail no lugar da pessoa. Exigir o clique evita isso.
 *
 * Para a apresentacao: e o carimbo de "e-mail confirmado".
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/rate-limit";
import { confirmarVerificacao } from "@/lib/verificacao-email";

const bodySchema = z.object({ token: z.string().trim().max(128) });

export async function POST(request: Request) {
  // BLOCO 1 - Limite de tentativas por endereco de internet, contra quem
  // tentar adivinhar codigos (mesma ideia da consulta de protocolo).
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";
  const rateLimit = allowRequest(`verificar-email:${clientIp}`, 10);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  // BLOCO 2 - Confere o codigo e devolve o resultado.
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const resultado = parsed.success ? await confirmarVerificacao(parsed.data.token) : null;

  if (!resultado?.ok) {
    const erro =
      resultado?.motivo === "expirado"
        ? "Este link expirou. Peça um novo link de confirmação."
        : "Link inválido ou já utilizado.";

    return NextResponse.json({ erro }, { status: 400 });
  }

  return NextResponse.json({ tipo: resultado.tipo });
}
