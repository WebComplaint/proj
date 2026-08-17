import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { requirePainelSession } from "@/lib/server-auth";

export async function GET() {
  const auth = await requirePainelSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = await getDashboardData();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ erro: "Não foi possível carregar as estatísticas agora." }, { status: 500 });
  }
}
