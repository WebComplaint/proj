"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * O botao "Reenviar link" da tela de e-mail pendente do painel.
 *
 * Para a apresentacao: o "nao recebi o e-mail".
 */

import { useState } from "react";
import { NeuButton } from "@/components/ui";

export function ReenviarVerificacao() {
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function reenviar() {
    setLoading(true);
    setMensagem(null);

    try {
      const response = await fetch("/api/verificar-email/reenviar", { method: "POST" });
      const result = await response.json();

      setMensagem(
        response.ok
          ? { texto: "Enviamos um novo link. Confira sua caixa de entrada e a pasta de spam.", erro: false }
          : { texto: result.erro, erro: true }
      );
    } catch {
      setMensagem({ texto: "Não foi possível reenviar agora. Tente novamente.", erro: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      {mensagem && (
        <p
          className={`rounded-soft p-3 text-sm font-bold ${mensagem.erro ? "bg-danger-100 text-danger-600" : "bg-mint-200 text-ocean-900"}`}
          role={mensagem.erro ? "alert" : "status"}
        >
          {mensagem.texto}
        </p>
      )}
      <NeuButton loading={loading} onClick={reenviar} variant="secondary">
        Reenviar link
      </NeuButton>
    </div>
  );
}
