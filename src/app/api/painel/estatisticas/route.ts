/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Entrega os numeros do painel (os mesmos cartoes e graficos da tela
 * inicial) em formato de dados, para quem estiver logado.
 *
 * Existe para permitir que outro sistema da escola, ou um aplicativo
 * futuro, aproveite os mesmos indicadores sem refazer as contas.
 *
 * Para a apresentacao: e a prova de que o sistema pode se integrar a outros.
 */

import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { requirePainelSession } from "@/lib/server-auth";

export async function GET() {
  // BLOCO 1 - Exige login. Sao numeros gerais, sem nome de ninguem, mas ainda
  // assim informacao interna da escola.
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // BLOCO 2 - Pede os numeros prontos ao arquivo lib/dashboard.ts e devolve.
    // Esta rota nao faz conta nenhuma: ela so entrega o resultado. As contas
    // ficam em um lugar so, e a tela do painel usa exatamente as mesmas.
    const data = await getDashboardData();

    return NextResponse.json(data);
  } catch {
    // BLOCO 3 - Qualquer falha vira erro 500 com mensagem em portugues comum.
    return NextResponse.json({ erro: "Não foi possível carregar as estatísticas agora." }, { status: 500 });
  }
}
