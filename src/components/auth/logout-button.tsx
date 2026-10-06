"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o botao Sair da conta. Encerra a sessao no Supabase e leva a pessoa de
 * volta para a tela de login.
 *
 * Para a apresentacao: pode pular, e o fim do fluxo de acesso.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NeuButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // BLOCO UNICO - Encerra a sessao em tres passos:
  //   1. avisa o Supabase para invalidar a sessao (signOut);
  //   2. leva para a tela de login com "replace", que apaga a pagina do
  //      painel do historico do navegador. Assim o botao Voltar nao traz a
  //      pessoa de volta para uma tela que ela nao pode mais ver;
  //   3. recarrega os dados para o servidor esquecer quem estava ali.
  async function logout() {
    setLoading(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <NeuButton loading={loading} onClick={logout}>Sair da conta</NeuButton>;
}
