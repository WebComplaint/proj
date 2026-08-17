"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NeuButton, NeuCard, ProtocoloCard } from "@/components/ui";

export function ConfirmacaoDenuncia() {
  const [protocolo, setProtocolo] = useState<string | null>(null);

  useEffect(() => {
    const storedProtocol = sessionStorage.getItem("ultimoProtocoloDenuncia");
    setProtocolo(storedProtocol);
    sessionStorage.removeItem("ultimoProtocoloDenuncia");
  }, []);

  function downloadReceipt() {
    if (!protocolo) {
      return;
    }

    const content = [
      "Comprovante de denúncia escolar",
      "",
      `Protocolo: ${protocolo}`,
      "Guarde este código. Ele é a única forma de acompanhar uma denúncia anônima.",
      "",
      "Este comprovante não substitui atendimento de emergência."
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = `comprovante-${protocolo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!protocolo) {
    return (
      <NeuCard title="Protocolo não disponível" description="Por segurança, o protocolo só aparece uma vez logo após o envio.">
        <div className="grid gap-3 sm:flex">
          <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
            Fazer denúncia
          </Link>
          <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/acompanhar">
            Acompanhar denúncia
          </Link>
        </div>
      </NeuCard>
    );
  }

  return (
    <div className="grid gap-6">
      <ProtocoloCard protocolo={protocolo} />
      <NeuCard title="Guarde este código" variant="pressed">
        <p className="text-sm leading-6 text-text-secondary">
          Ele é a única forma de acompanhar uma denúncia anônima. Se você fechar esta tela, o protocolo não será exibido novamente.
        </p>
        <div className="mt-5 grid gap-3 sm:flex">
          <NeuButton className="w-full sm:w-auto" onClick={downloadReceipt}>
            Baixar comprovante
          </NeuButton>
          <Link
            className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto"
            href={`/acompanhar/${protocolo}`}
          >
            Acompanhar denúncia
          </Link>
        </div>
      </NeuCard>
    </div>
  );
}
