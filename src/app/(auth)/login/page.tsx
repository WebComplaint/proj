/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a tela de login da equipe da escola.
 *
 * Antes de desenhar qualquer coisa, ela verifica se a pessoa ja esta logada.
 * Se estiver, manda direto para o painel em vez de pedir a senha de novo.
 *
 * Para a apresentacao: e a fronteira entre a parte publica e a restrita.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { NeuCard } from "@/components/ui";
import { getPainelSession } from "@/lib/server-auth";

export default async function LoginPage() {
  // BLOCO 1 - Antes de desenhar qualquer coisa, verifica no SERVIDOR se a
  // pessoa ja esta logada. Estando, manda direto para o painel.
  // Isso evita a situacao confusa de alguem ja autenticado ver uma tela
  // pedindo a senha de novo.
  const session = await getPainelSession();

  if (session?.user?.id) {
    redirect("/painel");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard
        className="w-full"
        title="Entrar no painel"
        description="Acesso restrito à equipe autorizada da escola."
      >
        <BrandLogo className="mb-6" />
        {/* BLOCO 2 - O formulario propriamente dito.
            O <Suspense> em volta e uma exigencia tecnica do Next.js: o
            formulario le o endereco de retorno da URL, e isso so pode ser
            feito depois que a pagina chega ao navegador. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </NeuCard>
    </main>
  );
}
