"use client";

import { useState } from "react";
import { NeuButton } from "@/components/ui/neu-button";

type ProtocoloCardProps = {
  protocolo: string;
};

export function ProtocoloCard({ protocolo }: ProtocoloCardProps) {
  const [copied, setCopied] = useState(false);

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
