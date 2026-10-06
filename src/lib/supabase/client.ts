/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cria a conexao com o Supabase usada DENTRO DO NAVEGADOR da pessoa.
 * E ela que faz a tela de login funcionar.
 *
 * Usa apenas a chave publica, que pode ser vista por qualquer um sem risco.
 * A chave secreta nunca chega ao navegador.
 *
 * Para a apresentacao: e o lado do visitante conversando com o login.
 */

import { createBrowserClient } from "@supabase/ssr";

// BLOCO UNICO - Abre a conexao com o Supabase dentro do navegador.
// Os dois valores vem das configuracoes do servidor (as variaveis de ambiente),
// e nao estao escritos no codigo. Assim a escola troca de servidor sem mexer
// em nenhuma linha de programacao.
//
// O prefixo NEXT_PUBLIC no nome significa "pode ser visto por qualquer pessoa
// que abrir o site". Por isso apenas o endereco e a chave publica aparecem
// aqui. A chave secreta jamais entra em um arquivo que roda no navegador.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
