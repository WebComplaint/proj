/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * A pagina de "nao encontrado" (erro 404), em portugues.
 *
 * Sem este arquivo, o Next.js mostraria a pagina padrao dele, em ingles
 * ("This page could not be found"). Ela aparece quando alguem digita um
 * endereco que nao existe ou abre uma denuncia que nao existe no painel.
 *
 * Para a apresentacao: pode pular, e um detalhe de acabamento.
 */

import Link from "next/link";
import { NeuCard } from "@/components/ui";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard
        className="w-full"
        title="Página não encontrada"
        description="O endereço pode ter sido digitado errado, ou a página não existe mais."
      >
        <div className="grid gap-3">
          <Link className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/">
            Ir para a página inicial
          </Link>
          <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/acompanhar">
            Acompanhar uma denúncia
          </Link>
        </div>
      </NeuCard>
    </main>
  );
}
