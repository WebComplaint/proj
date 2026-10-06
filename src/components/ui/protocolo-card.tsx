"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o cartao de destaque que exibe o protocolo apos o envio da denuncia,
 * com o botao Copiar protocolo.
 *
 * O codigo aparece grande, em fonte de largura fixa, para nao restar duvida
 * entre caracteres parecidos na hora de anotar. E o botao de copiar evita
 * o erro de digitacao por completo.
 *
 * Para a apresentacao: este e o momento mais critico do fluxo publico. Se a
 * pessoa perder este codigo, nao ha como recuperar uma denuncia anonima.
 */

import { useState } from "react";
import { NeuButton } from "@/components/ui/neu-button";

type ProtocoloCardProps = {
  protocolo: string;
};

export function ProtocoloCard({ protocolo }: ProtocoloCardProps) {
  // Guarda se o codigo acabou de ser copiado, para trocar o texto do botao.
  const [copied, setCopied] = useState(false);

  // BLOCO 1 - Botao "Copiar protocolo".
  // Copia o codigo para a area de transferencia, troca o texto do botao para
  // "Copiado" e, depois de 1,8 segundo, volta ao texto original.
  // Essa confirmacao rapida importa: sem ela a pessoa nao sabe se o clique
  // funcionou e acaba clicando varias vezes, na duvida.
  async function copyProtocol() {
    await navigator.clipboard.writeText(protocolo);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="overflow-hidden rounded-cloud bg-base shadow-neuro-lg motion-safe:animate-[protocol-enter_200ms_ease-out]">
      <div className="h-4 bg-gradient-to-r from-aqua-300 to-turquoise-500" />
      <div className="p-6">
        <h2 className="text-2xl font-bold">Guarde seu protocolo</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Ele é a forma de acompanhar esta denúncia depois.
        </p>
        {/* BLOCO 2 - O CODIGO EM DESTAQUE.
            Aparece grande e centralizado, com a fonte "protocol", que e de
            largura fixa. Nesse tipo de fonte, cada caractere ocupa o mesmo
            espaco e fica bem mais dificil confundir letras parecidas na hora
            de anotar o codigo no papel. */}
        <div className="protocol mt-5 rounded-calm bg-base px-4 py-5 text-center text-2xl font-bold tracking-normal text-ocean-900 shadow-neuro-inset sm:text-3xl">
          {protocolo}
        </div>
        <NeuButton className="mt-5 w-full" onClick={copyProtocol}>
          {copied ? "Copiado" : "Copiar protocolo"}
        </NeuButton>
      </div>
    </section>
  );
}
