/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tela aberta pelo link de redefinicao de senha enviado por e-mail.
 *
 * Para a apresentacao: e onde a pessoa escolhe a senha nova.
 */

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form";
import { NeuCard } from "@/components/ui";

export const metadata = { title: "Criar senha nova" };

export default function RedefinirSenhaPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard className="w-full" title="Criar senha nova" description="Escolha a senha que você vai usar para entrar no painel.">
        <BrandLogo className="mb-6" />
        {token ? (
          <RedefinirSenhaForm token={token} />
        ) : (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-text-secondary">
              Link incompleto. Abra novamente o link recebido por e-mail ou peça um novo.
            </p>
            <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/esqueci-senha">
              Pedir um novo link
            </Link>
          </div>
        )}
      </NeuCard>
    </main>
  );
}
