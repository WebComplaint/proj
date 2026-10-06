/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tela simples com o nome e o e-mail de quem esta logado e o botao de sair.
 *
 * Para a apresentacao: use para mostrar quem esta usando o painel.
 */

import { LogoutButton } from "@/components/auth/logout-button";
import { getPainelSession } from "@/lib/server-auth";

export default async function ContaPage() {
  // Le o cracha de quem esta logado para mostrar nome e e-mail na tela.
  // E util em computadores compartilhados da secretaria: antes de agir em um
  // caso, a pessoa confere de quem e a sessao aberta ali.
  const session = await getPainelSession();

  return (
    <main className="mx-auto w-full max-w-6xl">
      <section className="surface-neuro p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Conta</h1>
        <p className="mt-3 text-text-secondary">{session?.user.name} · {session?.user.email}</p>
        <div className="mt-6"><LogoutButton /></div>
      </section>
    </main>
  );
}
