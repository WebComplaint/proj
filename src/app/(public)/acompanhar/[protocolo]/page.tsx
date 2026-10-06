/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Mostra a situacao de UM protocolo especifico.
 *
 * O nome da pasta entre colchetes, [protocolo], significa que essa parte do
 * endereco muda: /acompanhar/DEN-2026-A2B3C4 abre esta mesma pagina com
 * aquele codigo. O codigo digitado e padronizado em letras maiusculas antes
 * da consulta, para que den-2026-a2b3c4 tambem funcione.
 *
 * Para a apresentacao: e a tela de acompanhamento do caso.
 */

import { AcompanhamentoProtocolo } from "@/components/publico/acompanhamento-protocolo";

type AcompanharProtocoloPageProps = {
  params: {
    protocolo: string;
  };
};

export default function AcompanharProtocoloPage({ params }: AcompanharProtocoloPageProps) {
  // Padroniza o codigo vindo do endereco antes de consultar:
  //   decodeURIComponent -> desfaz os codigos que o navegador usa na URL;
  //   trim               -> remove espacos das pontas;
  //   toUpperCase        -> deixa tudo em maiusculas.
  // Assim, /acompanhar/den-2026-a2b3c4 funciona igual a versao em maiusculas.
  const protocolo = decodeURIComponent(params.protocolo).trim().toUpperCase();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <AcompanhamentoProtocolo protocolo={protocolo} />
    </main>
  );
}
