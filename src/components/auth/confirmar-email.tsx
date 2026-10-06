"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * O botao "Confirmar e-mail" da tela aberta pelo link enviado por e-mail.
 *
 * A confirmacao so acontece no clique, e nao ao abrir a pagina: alguns
 * servicos de e-mail abrem os links sozinhos para checar se sao seguros, e
 * isso nao pode contar como confirmacao da pessoa.
 *
 * Para a apresentacao: o ultimo passo da verificacao de e-mail.
 */

import Link from "next/link";
import { useState } from "react";
import { NeuButton } from "@/components/ui";

type Estado = { fase: "inicio" } | { fase: "ok"; tipo: "USUARIO" | "DENUNCIANTE" } | { fase: "erro"; mensagem: string };

export function ConfirmarEmail({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "inicio" });
  const [loading, setLoading] = useState(false);

  // BLOCO 1 - Envia o codigo do link ao servidor e mostra o resultado.
  async function confirmar() {
    setLoading(true);

    try {
      const response = await fetch("/api/verificar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const result = await response.json();

      setEstado(response.ok ? { fase: "ok", tipo: result.tipo } : { fase: "erro", mensagem: result.erro });
    } catch {
      setEstado({ fase: "erro", mensagem: "Não foi possível confirmar agora. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  // BLOCO 2 - Deu certo: a mensagem muda conforme quem confirmou.
  if (estado.fase === "ok") {
    return estado.tipo === "USUARIO" ? (
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-text-secondary">E-mail confirmado. Seu acesso ao painel está liberado.</p>
        <Link className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-4" href="/painel">
          Ir para o painel
        </Link>
      </div>
    ) : (
      <p className="text-sm leading-6 text-text-secondary">
        E-mail confirmado. Você receberá avisos quando houver novidades sobre a sua denúncia. Você pode fechar esta página.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {estado.fase === "erro" && (
        <p className="rounded-soft bg-danger-100 p-3 text-sm font-bold text-danger-600" role="alert">
          {estado.mensagem}
        </p>
      )}
      <NeuButton loading={loading} onClick={confirmar}>
        Confirmar e-mail
      </NeuButton>
    </div>
  );
}
