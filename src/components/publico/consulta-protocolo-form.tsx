"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NeuButton, NeuInput } from "@/components/ui";

export function ConsultaProtocoloForm() {
  const router = useRouter();
  const [protocolo, setProtocolo] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = protocolo.trim().toUpperCase();

    if (!/^DEN-\d{4}-[2-9A-HJKMNP-Z]{6}$/.test(normalized)) {
      setError("Informe um protocolo no formato DEN-AAAA-XXXXXX.");
      return;
    }

    router.push(`/acompanhar/${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <NeuInput
        label="Código do protocolo"
        name="protocolo"
        placeholder="DEN-2026-A2B3C4"
        value={protocolo}
        onChange={(event) => {
          setProtocolo(event.target.value.toUpperCase());
          setError("");
        }}
        error={error}
        inputMode="text"
        autoComplete="off"
      />
      <NeuButton className="w-full sm:w-auto" size="lg" type="submit">
        Consultar denúncia
      </NeuButton>
    </form>
  );
}
