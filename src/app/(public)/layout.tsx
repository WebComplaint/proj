import { EmergencyBar } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";

export default function PublicLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen pb-36 sm:pb-24">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <BrandLogo />
        <nav className="hidden items-center gap-2 text-sm font-bold text-text-secondary sm:flex" aria-label="Navegação pública">
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/como-funciona">
            Como funciona
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/privacidade">
            Privacidade
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/ajuda">
            Ajuda
          </a>
        </nav>
      </header>
      {children}
      <EmergencyBar />
    </div>
  );
}
