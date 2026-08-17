import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { isCoordenadorOuAdmin } from "@/lib/permissoes";
import { getPainelSession } from "@/lib/server-auth";

export default async function PainelLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
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
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/painel/conta">
            Conta
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}
