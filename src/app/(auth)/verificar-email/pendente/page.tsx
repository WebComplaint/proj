/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tela mostrada ao funcionario que entrou com a senha certa, mas ainda nao
 * confirmou o e-mail. O porteiro (middleware.ts) manda para ca qualquer
 * tentativa de abrir o painel nessa situacao.
 *
 * Fica fora de /painel de proposito: se ficasse dentro, o proprio porteiro
 * a bloquearia, e a pessoa entraria em um ciclo sem saida.
 *
 * Para a apresentacao: conta nova so entra depois de provar o e-mail.
 */

import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { ReenviarVerificacao } from "@/components/auth/reenviar-verificacao";
import { NeuCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmailPendentePage() {
  // BLOCO 1 - Quem esta aqui? Sem login, volta para a tela de login; ja
  // confirmado, segue para o painel.
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { authUserId: data.user.id },
    select: { email: true, ativo: true, emailVerificadoEm: true }
  });

  if (!usuario?.ativo) redirect("/login");
  if (usuario.emailVerificadoEm) redirect("/painel");

  // BLOCO 2 - A tela: explica o que falta e oferece reenviar o link.
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <NeuCard className="w-full" title="Confirme seu e-mail" description="Falta um passo para liberar o seu acesso.">
        <BrandLogo className="mb-6" />
        <div className="grid gap-5">
          <p className="text-sm leading-6 text-text-secondary">
            Enviamos um link de confirmação para <strong className="text-text-primary">{usuario.email}</strong>. Abra o link e
            clique em &quot;Confirmar e-mail&quot; para entrar no painel.
          </p>
          <ReenviarVerificacao />
          <LogoutButton />
        </div>
      </NeuCard>
    </main>
  );
}
