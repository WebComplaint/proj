/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a tela aberta pelo link de confirmacao enviado por e-mail. Serve tanto
 * para funcionarios do painel quanto para quem fez uma denuncia identificada.
 *
 * Para a apresentacao: no modo de demonstracao, o link aparece no registro
 * do servidor ([email:console]); basta copia-lo para o navegador.
 */

import { BrandLogo } from "@/components/brand-logo";
import { ConfirmarEmail } from "@/components/auth/confirmar-email";
import { NeuCard } from "@/components/ui";

export default function VerificarEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard className="w-full" title="Confirmar e-mail" description="Confirme que este endereço de e-mail é seu.">
        <BrandLogo className="mb-6" />
        {token ? (
          <ConfirmarEmail token={token} />
        ) : (
          <p className="text-sm leading-6 text-text-secondary">
            Link incompleto. Abra novamente o link recebido por e-mail ou peça um novo.
          </p>
        )}
      </NeuCard>
    </main>
  );
}
