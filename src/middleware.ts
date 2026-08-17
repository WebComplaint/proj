import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { exigeAdmin, isAdmin, isCoordenadorOuAdmin } from "@/lib/permissoes";

function unauthorizedApi() {
  return NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 });
}

function forbiddenApi() {
  return NextResponse.json({ erro: "Você não tem permissão para acessar este recurso." }, { status: 403 });
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );
  const { data } = await supabase.auth.getUser();
  const { data: usuario } = data.user
    ? await supabase.from("Usuario").select("perfil, ativo").eq("authUserId", data.user.id).maybeSingle()
    : { data: null };
  const perfil = usuario?.perfil;
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  if (!data.user || !usuario?.ativo || !isCoordenadorOuAdmin(perfil)) {
    if (isApi) return unauthorizedApi();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (exigeAdmin(pathname) && !isAdmin(perfil)) {
    if (isApi) return forbiddenApi();
    const deniedUrl = new URL("/painel", request.url);
    deniedUrl.searchParams.set("acesso", "negado");
    return NextResponse.redirect(deniedUrl);
  }

  return response;
}

export const config = { matcher: ["/painel/:path*", "/api/painel/:path*"] };
