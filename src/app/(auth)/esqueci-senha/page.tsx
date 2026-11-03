/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tela do "esqueci minha senha", aberta pelo link da tela de login.
 *
 * Para a apresentacao: no modo de demonstracao, o link de redefinicao
 * aparece no registro do servidor ([email:console]); basta copia-lo para o
 * navegador.
 */

import { BrandLogo } from "@/components/brand-logo";
import { EsqueciSenhaForm } from "@/components/auth/esqueci-senha-form";
import { NeuCard } from "@/components/ui";

export const metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard
        className="w-full"
        title="Esqueci minha senha"
        description="Informe o e-mail da sua conta no painel. Enviaremos um link para você criar uma senha nova."
      >
        <BrandLogo className="mb-6" />
        <EsqueciSenhaForm />
      </NeuCard>
    </main>
  );
}
