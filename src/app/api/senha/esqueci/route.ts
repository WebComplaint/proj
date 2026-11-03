/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Recebe o pedido de "esqueci minha senha" da tela de login e, se o e-mail
 * for de uma conta ativa do painel, envia o link de redefinicao.
 *
 * A resposta e SEMPRE a mesma, exista a conta ou nao. Se a tela dissesse
 * "esse e-mail nao esta cadastrado", alguem poderia testar enderecos ate
 * descobrir quem trabalha na escola e tem acesso ao painel.
 *
 * Esta rota fica fora de /api/painel de proposito: quem esqueceu a senha
 * ainda nao conseguiu entrar.
 *
 * Para a apresentacao: e o primeiro passo do "esqueci minha senha".
 */

import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { pedirRedefinicao } from "@/lib/redefinicao-senha";
import { esqueciSenhaSchema } from "@/lib/validacoes";

const RESPOSTA_PADRAO = {
  mensagem: "Se o e-mail estiver cadastrado no painel, enviaremos um link para criar uma senha nova. Confira sua caixa de entrada."
};

export async function POST(request: Request) {
  // BLOCO 1 - Limite de pedidos: 5 a cada 10 minutos por endereco de
  // internet e 3 por hora para o mesmo e-mail. Sem isso, o formulario
  // viraria uma forma de lotar a caixa de entrada de alguem.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";

  if (!allowRequest(`esqueci-senha-ip:${clientIp}`, 5).allowed) {
    return NextResponse.json(
      { erro: "Muitos pedidos seguidos. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  // BLOCO 2 - Confere o formato do e-mail.
  const parsed = esqueciSenhaSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Informe um e-mail válido.", campos: { email: "Informe um e-mail válido." } },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  // Passou do limite para este e-mail: responde igual, sem enviar de novo.
  if (!allowRequest(`esqueci-senha-email:${email}`, 3, 60 * 60 * 1000).allowed) {
    return NextResponse.json(RESPOSTA_PADRAO);
  }

  // BLOCO 3 - Envia o link (so se a conta existir e estiver ativa).
  // Uma falha no envio fica registrada no servidor, mas a resposta continua
  // a mesma, para nao revelar que a conta existe.
  try {
    await pedirRedefinicao(email);
  } catch (error) {
    console.error("[redefinicao-senha] falha ao enviar link", error);
  }

  return NextResponse.json(RESPOSTA_PADRAO);
}
