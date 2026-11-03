/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a moldura da parte PUBLICA do site, aquela que nao exige login.
 *
 * Coloca em toda pagina publica o cabecalho com a logo, o menu (Como
 * funciona, Privacidade, Ajuda) e a barra fixa de emergencia no rodape.
 *
 * Essa barra de emergencia aparece em TODAS as telas publicas de proposito:
 * o sistema nunca deixa a pessoa sem os telefones de socorro a vista.
 *
 * Para a apresentacao: e a moldura das telas abertas ao publico.
 */

import { EmergencyBar } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";

export default function PublicLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // O espaco extra embaixo (pb-36) reserva lugar para a barra fixa de
    // emergencia, para que ela nunca cubra o final do conteudo da pagina.
    <div className="min-h-screen pb-36 sm:pb-24">
      {/* BLOCO 1 - Cabecalho com a logo e o menu.
          O menu some no celular (hidden ... sm:flex) para dar espaco ao que
          realmente importa na tela pequena: o conteudo e os botoes de acao. */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <BrandLogo />
        <nav className="hidden items-center gap-2 text-sm font-bold text-text-secondary sm:flex" aria-label="Navegação pública">
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/como-funciona">
            Como funciona
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/privacidade">
            Privacidade
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/termo-de-consentimento">
            Termo de consentimento
          </a>
          <a className="rounded-soft px-3 py-2 hover:bg-white/35" href="/ajuda">
            Ajuda
          </a>
        </nav>
      </header>
      {/* BLOCO 2 - O conteudo da tela atual entra aqui. */}
      {children}

      {/* BLOCO 3 - A barra de emergencia, presente em TODAS as telas publicas.
          Estar aqui, e nao dentro de cada pagina, e o que garante que ela
          nunca seja esquecida em uma tela nova. */}
      <EmergencyBar />
    </div>
  );
}
