/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Recebe o codigo do link de redefinicao e a senha nova, e troca a senha.
 *
 * Assim como a confirmacao de e-mail, a troca so acontece no clique do botao
 * (POST), e nao ao abrir o link: alguns servicos de e-mail abrem os links
 * sozinhos para checar se sao perigosos.
 *
 * Para a apresentacao: e o segundo passo do "esqueci minha senha".
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { allowRequest } from "@/lib/rate-limit";
import { redefinirSenha } from "@/lib/redefinicao-senha";
import { redefinirSenhaSchema } from "@/lib/validacoes";

export async function POST(request: Request) {
  // BLOCO 1 - Limite de tentativas por endereco de internet, contra quem
  // tentar adivinhar codigos.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";
  const rateLimit = allowRequest(`redefinir-senha:${clientIp}`, 10);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    // BLOCO 2 - Confere o codigo e a senha nova (minimo de 10 caracteres e
    // as duas digitacoes iguais).
    const data = redefinirSenhaSchema.parse(await request.json());
    const resultado = await redefinirSenha(data.token, data.senha);

    if (!resultado.ok) {
      const erro =
        resultado.motivo === "expirado"
          ? "Este link expirou. Peça um novo link na tela de login."
          : "Link inválido ou já utilizado. Peça um novo link na tela de login.";

      return NextResponse.json({ erro }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    console.error("[redefinicao-senha] falha ao trocar a senha", error);

    return NextResponse.json({ erro: "Não foi possível trocar a senha agora. Tente novamente." }, { status: 500 });
  }
}
