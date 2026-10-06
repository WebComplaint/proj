/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a moldura de todas as telas do painel da escola, com o menu superior.
 *
 * Faz duas coisas importantes:
 *   1. Confere novamente se a pessoa esta logada e autorizada.
 *   2. Monta o menu conforme o cargo. O item "Corpo docente" so aparece
 *      para o administrador.
 *
 * Esconder o menu e conforto, nao seguranca. Quem digitasse o endereco na
 * mao continuaria sendo barrado pelo porteiro e pela API.
 *
 * Para a apresentacao: o menu se adapta ao cargo de quem entrou.
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { isAdmin, isCoordenadorOuAdmin } from "@/lib/permissoes";
import { getPainelSession } from "@/lib/server-auth";

export default async function PainelLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  // BLOCO 1 - SEGUNDA CONFERENCIA DE ACESSO.
  // O porteiro (middleware.ts) ja checou isso antes. Repetir aqui e proposital:
  // se um dia o porteiro for mal configurado, esta linha ainda barra o acesso.
  // Em seguranca, isso se chama defesa em camadas.
  const session = await getPainelSession();

  if (!session?.user?.id || !isCoordenadorOuAdmin(session.user.perfil)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <header className="mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo />
        <nav className="grid grid-cols-2 gap-2 text-sm font-bold text-text-secondary sm:flex" aria-label="Navegação do painel">
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel">
            Painel
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel/denuncias">
            Denúncias
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel/relatorios">
            Relatórios
          </a>
          {/* BLOCO 2 - O MENU MUDA CONFORME O CARGO.
              "Corpo docente" so aparece para o administrador.
              Atencao: esconder o item e apenas conforto visual, e nao
              seguranca. Se um professor digitar o endereco na mao, quem o
              barra sao o porteiro e a propria rota da API. */}
          {isAdmin(session.user.perfil) && (
            <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel/usuarios">
              Corpo docente
            </a>
          )}
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel/conta">
            Conta
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}
