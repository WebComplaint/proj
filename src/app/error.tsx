"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * A pagina de "algo deu errado", em portugues.
 *
 * Sem este arquivo, uma falha inesperada (o banco fora do ar, por exemplo)
 * mostraria a mensagem padrao do Next.js, em ingles ("Application error").
 * Aqui a pessoa le uma frase simples e pode tentar de novo. O detalhe
 * tecnico do erro nunca aparece na tela.
 *
 * Para a apresentacao: pode pular, e um detalhe de acabamento.
 */

import Link from "next/link";
import { useEffect } from "react";
import { NeuButton, NeuCard } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Registra o erro no console do navegador, para quem estiver depurando.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard
        className="w-full"
        title="Algo deu errado"
        description="Não foi possível carregar esta página agora. Tente novamente em instantes."
      >
        <div className="grid gap-3">
          <NeuButton onClick={reset}>Tentar novamente</NeuButton>
          <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/">
            Ir para a página inicial
          </Link>
        </div>
      </NeuCard>
    </main>
  );
}
