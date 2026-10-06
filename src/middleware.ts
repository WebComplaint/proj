/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Este e o PORTEIRO do sistema. Toda vez que alguem tenta abrir uma pagina
 * do painel da escola, o pedido passa por aqui ANTES de qualquer outra coisa.
 *
 * O porteiro faz quatro perguntas, nesta ordem:
 *   1. Voce esta logado?           Se nao -> manda para a tela de login.
 *   2. Sua conta esta ativa?       Se nao -> manda para a tela de login.
 *   3. Seu e-mail esta confirmado? Se nao -> manda confirmar o e-mail.
 *   4. Voce tem permissao aqui?    Se nao -> volta para o painel comum.
 *
 * As paginas publicas (fazer denuncia, acompanhar protocolo) NAO passam por
 * aqui: qualquer pessoa pode usa-las sem login.
 *
 * Para a apresentacao: e a primeira camada de seguranca do sistema.
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { exigeAdmin, isAdmin, isCoordenadorOuAdmin } from "@/lib/permissoes";

// BLOCO 1 - As duas respostas de recusa usadas quando o pedido veio de um
// programa, e nao de uma pessoa navegando.
//   401 = "nao sei quem voce e" (nao esta logado).
//   403 = "sei quem voce e, mas voce nao pode entrar aqui" (falta permissao).
function unauthorizedApi() {
  return NextResponse.json({ erro: "Entre no painel para continuar." }, { status: 401 });
}

function forbiddenApi() {
  return NextResponse.json({ erro: "Você não tem permissão para acessar este recurso." }, { status: 403 });
}

// BLOCO 2 - O porteiro em si. Roda antes de qualquer pagina do painel abrir.
export async function middleware(request: NextRequest) {
  // Prepara a resposta que seguira adiante caso tudo esteja certo.
  let response = NextResponse.next({ request });

  // Abre a conexao com o Supabase levando os cookies deste pedido.
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
  // BLOCO 3 - Descobre QUEM esta batendo na porta.
  // Primeiro pergunta ao Supabase de quem e a sessao aberta.
  const { data } = await supabase.auth.getUser();

  // Depois busca o cargo e a situacao dessa pessoa na tabela de usuarios.
  // Se nao ha ninguem logado, nem chega a consultar o banco.
  const { data: usuario } = data.user
    ? await supabase.from("Usuario").select("perfil, ativo, emailVerificadoEm").eq("authUserId", data.user.id).maybeSingle()
    : { data: null };
  const perfil = usuario?.perfil;

  // Guarda o endereco que a pessoa tentou abrir e se o pedido veio de um
  // programa (/api/...) ou de alguem navegando no site.
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  // BLOCO 4 - PRIMEIRA TRAVA: esta pessoa pode entrar no painel?
  // Sao tres condicoes ao mesmo tempo: estar logada, ter a conta ativa e ter
  // um dos quatro cargos da equipe. Basta uma falhar para o acesso ser negado.
  if (!data.user || !usuario?.ativo || !isCoordenadorOuAdmin(perfil)) {
    // Programa recebe erro em texto; pessoa e levada para a tela de login.
    if (isApi) return unauthorizedApi();

    // Guarda no endereco a pagina que ela queria abrir (callbackUrl).
    // Depois de fazer login, ela volta direto para la, em vez de cair na
    // tela inicial e ter que procurar de novo o que estava fazendo.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // BLOCO 5 - SEGUNDA TRAVA: a pessoa ja provou que o e-mail e dela?
  // Conta criada ou com e-mail trocado fica aqui ate clicar no link enviado.
  // A tela de pendencia fica fora do painel, para nao cair em um ciclo.
  if (!usuario.emailVerificadoEm) {
    if (isApi) {
      return NextResponse.json({ erro: "Confirme seu e-mail para continuar." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/verificar-email/pendente", request.url));
  }

  // BLOCO 6 - TERCEIRA TRAVA: esta area e exclusiva de administrador?
  // Aqui a pessoa ja passou pela primeira trava, entao ela e da equipe.
  // A pergunta agora e outra: ela pode entrar NESTA area especifica?
  if (exigeAdmin(pathname) && !isAdmin(perfil)) {
    if (isApi) return forbiddenApi();

    // Um professor que tentar abrir a tela de usuarios volta para o painel
    // com um aviso explicando por que, em vez de ver uma pagina de erro seca.
    const deniedUrl = new URL("/painel", request.url);
    deniedUrl.searchParams.set("acesso", "negado");
    return NextResponse.redirect(deniedUrl);
  }

  // BLOCO 7 - Passou por todas as travas: pode seguir para a pagina pedida.
  return response;
}

// BLOCO 8 - Onde o porteiro fica de plantao.
// O ":path*" quer dizer "e tudo que vier depois".
// Ou seja, ele vigia todo o painel e toda a API do painel, e apenas isso.
// As telas publicas (denunciar, acompanhar, ajuda) ficam de fora de proposito:
// elas precisam funcionar para qualquer pessoa, sem login.
export const config = { matcher: ["/painel/:path*", "/api/painel/:path*"] };
