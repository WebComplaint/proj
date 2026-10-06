"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o campo onde a pessoa digita o protocolo para acompanhar a denuncia.
 *
 * Enquanto ela digita, o texto ja e convertido para maiusculas. Antes de
 * consultar, o formato e conferido. Se estiver errado, o aviso aparece na
 * hora, sem gastar uma das 5 tentativas permitidas no servidor.
 *
 * Para a apresentacao: e o comeco do fluxo de acompanhamento.
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NeuButton, NeuInput } from "@/components/ui";

export function ConsultaProtocoloForm() {
  // BLOCO 1 - A memoria da tela: o codigo digitado e o erro, se houver.
  const router = useRouter();
  const [protocolo, setProtocolo] = useState("");
  const [error, setError] = useState("");

  // BLOCO 2 - O que acontece ao clicar em "Consultar denuncia".
  function submit(event: FormEvent<HTMLFormElement>) {
    // Impede o comportamento antigo dos formularios, que recarregava a pagina
    // inteira. Assim a tela responde na hora, sem piscar.
    event.preventDefault();

    // Padroniza o que foi digitado: tira espacos das pontas e poe em
    // maiusculas. Colar um codigo de um e-mail costuma trazer espaco junto.
    const normalized = protocolo.trim().toUpperCase();

    // Confere o formato AQUI, antes de incomodar o servidor.
    // Isso importa por causa do limite de 5 consultas a cada 10 minutos: um
    // simples erro de digitacao nao pode gastar uma das tentativas da pessoa.
    if (!/^DEN-\d{4}-[2-9A-HJKMNP-Z]{6}$/.test(normalized)) {
      setError("Informe um protocolo no formato DEN-AAAA-XXXXXX.");
      return;
    }

    // Formato correto: leva para a tela de acompanhamento daquele protocolo.
    router.push(`/acompanhar/${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <NeuInput
        label="Código do protocolo"
        name="protocolo"
        placeholder="DEN-2026-A2B3C4"
        value={protocolo}
        // BLOCO 3 - A cada tecla digitada: converte para maiuscula na hora e
        // apaga o erro anterior. A pessoa ve o codigo se formando no formato
        // certo e a mensagem em vermelho some assim que ela comeca a corrigir.
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
