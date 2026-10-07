/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Guarda os arquivos anexados as denuncias e devolve um link para a equipe
 * abri-los.
 *
 * Onde o arquivo fica depende de onde o sistema esta rodando:
 *   - Com o Supabase configurado (producao na Vercel): no Supabase Storage,
 *     em uma pasta PRIVADA chamada "anexos". Ninguem abre um anexo pelo
 *     endereco direto; o painel gera um link temporario que vale 1 hora.
 *   - Sem a chave do Supabase (computador de desenvolvimento): na pasta
 *     public/uploads do proprio projeto, como antes.
 *
 * Por que nao gravar sempre em disco? Na Vercel o disco do servidor e
 * somente leitura. Gravar la falhava, e por isso o envio de anexos quebrava
 * em producao.
 *
 * Para a apresentacao: os anexos ficam em um cofre, e a equipe recebe uma
 * chave que expira.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// BLOCO 1 - O nome da pasta privada no Supabase Storage e por quanto tempo
// o link de visualizacao vale (em segundos).
const BUCKET = "anexos";
const VALIDADE_LINK_S = 60 * 60;

// Prefixos gravados no banco, para saber onde cada anexo esta guardado.
const PREFIXO_STORAGE = `${BUCKET}/`;
const PREFIXO_LOCAL = "/uploads/";

// BLOCO 2 - Conexao administrativa com o Supabase.
// Usa a chave secreta, que so existe no servidor. Sem ela, devolve null e o
// sistema usa o disco local.
function getStorageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) return null;

  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

// BLOCO 3 - Guarda o arquivo e devolve o endereco que vai para o banco.
export async function salvarAnexo(nomeArquivo: string, conteudo: Buffer, tipoMime: string) {
  const storage = getStorageAdmin();

  if (storage) {
    const enviar = () => storage.from(BUCKET).upload(nomeArquivo, conteudo, { contentType: tipoMime, upsert: false });
    let { error } = await enviar();

    // Primeira vez: a pasta privada ainda nao existe. Cria e tenta de novo.
    if (error && /bucket not found/i.test(error.message)) {
      const criacao = await storage.createBucket(BUCKET, { public: false });
      if (criacao.error && !/already exists/i.test(criacao.error.message)) throw criacao.error;
      ({ error } = await enviar());
    }

    if (error) throw error;

    return `${PREFIXO_STORAGE}${nomeArquivo}`;
  }

  // Na Vercel, sem a chave, nao ha onde guardar: melhor avisar do que fingir.
  if (process.env.VERCEL) {
    throw new Error("Armazenamento de anexos não configurado (SUPABASE_SECRET_KEY).");
  }

  const pasta = path.join(process.cwd(), "public", "uploads");
  await mkdir(pasta, { recursive: true });
  await writeFile(path.join(pasta, nomeArquivo), conteudo);

  return `${PREFIXO_LOCAL}${nomeArquivo}`;
}

// BLOCO 4 - Transforma os enderecos do banco em links que a equipe consegue
// abrir. Os do Storage viram links temporarios assinados; os locais ficam
// como estao. Um anexo cujo link falhar fica com null.
export async function gerarLinksAnexos(enderecos: string[]): Promise<Array<string | null>> {
  const doStorage = enderecos.filter((endereco) => endereco.startsWith(PREFIXO_STORAGE));
  const links = new Map<string, string>();
  const storage = doStorage.length > 0 ? getStorageAdmin() : null;

  if (storage) {
    const caminhos = doStorage.map((endereco) => endereco.slice(PREFIXO_STORAGE.length));
    const { data } = await storage.from(BUCKET).createSignedUrls(caminhos, VALIDADE_LINK_S);

    data?.forEach((item, indice) => {
      if (item.signedUrl) links.set(doStorage[indice], item.signedUrl);
    });
  }

  return enderecos.map((endereco) =>
    endereco.startsWith(PREFIXO_LOCAL) ? endereco : (links.get(endereco) ?? null)
  );
}
