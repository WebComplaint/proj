/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cria a conexao com o Supabase usada NO SERVIDOR.
 *
 * A diferenca para a versao do navegador e que aqui o sistema le os cookies
 * do pedido. E assim que o servidor sabe que a pessoa ja esta logada antes
 * mesmo de desenhar a pagina.
 *
 * Para a apresentacao: e o lado do servidor reconhecendo quem entrou.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// BLOCO UNICO - Abre a conexao com o Supabase do lado do servidor.
export function createSupabaseServerClient() {
  // Pega os cookies que vieram junto com o pedido do navegador.
  // Cookie e um bilhetinho que o navegador guarda e reenvia a cada visita.
  // E nele que fica a prova de que a pessoa ja fez login.
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // LER: entrega ao Supabase os bilhetinhos recebidos, para ele conferir
        // se a sessao ainda e valida.
        getAll: () => cookieStore.getAll(),

        // ESCREVER: guarda os bilhetinhos atualizados (por exemplo, quando a
        // sessao e renovada automaticamente).
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Em algumas telas o Next.js proibe escrever cookies enquanto a
            // pagina esta sendo montada. Nao e erro de verdade: o porteiro
            // (middleware.ts) ja cuidou dessa atualizacao antes. Por isso o
            // erro e ignorado aqui em vez de derrubar a pagina.
            // O middleware atualiza os cookies quando Server Components não podem escrevê-los.
          }
        }
      }
    }
  );
}
