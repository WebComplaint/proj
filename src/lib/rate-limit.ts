/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Limita quantas consultas de protocolo a mesma pessoa pode fazer: no
 * maximo 5 tentativas a cada 10 minutos.
 *
 * Por que isso existe? Sem esse limite, um programa malicioso poderia testar
 * milhares de codigos por minuto ate acertar um protocolo valido e ler uma
 * denuncia que nao e dele. Com o limite, esse ataque leva tanto tempo que
 * deixa de ser viavel.
 *
 * Para a apresentacao: e o cadeado contra tentativa e erro.
 */

// BLOCO 1 - A "ficha de controle" de cada visitante.
// count   = quantas consultas ele ja fez.
// resetAt = a que horas essa contagem zera e ele ganha tentativas novas.
type RateLimitBucket = {
  count: number;
  resetAt: number;
};

// BLOCO 2 - A resposta que este arquivo devolve para quem perguntou.
// allowed   = pode consultar agora, sim ou nao.
// remaining = quantas tentativas ainda sobram.
// resetAt   = quando as tentativas voltam.
type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// BLOCO 3 - O caderninho onde as fichas ficam guardadas.
// Uma linha por visitante, identificada pelo endereco de internet dele.
const buckets = new Map<string, RateLimitBucket>();

// BLOCO 4 - A funcao que responde: esta pessoa pode consultar agora?
// Os valores padrao sao 5 tentativas (limit) a cada 10 minutos (windowMs).
// A conta 10 * 60 * 1000 esta em milissegundos: 10 minutos x 60 segundos x 1000.
export function allowRequest(key: string, limit = 5, windowMs = 10 * 60 * 1000): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  // CASO 1 - Visitante novo, ou a ficha antiga dele ja venceu.
  // Abre uma ficha zerada e libera a consulta.
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt
    };
  }

  // CASO 2 - Ja gastou as 5 tentativas dentro da janela de 10 minutos.
  // Recusa e informa a que horas ele podera tentar de novo.
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt
    };
  }

  // CASO 3 - Ainda tem tentativa sobrando: marca mais uma e libera.
  current.count += 1;

  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: current.resetAt
  };
}
