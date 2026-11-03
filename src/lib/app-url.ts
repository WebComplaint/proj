/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Descobre o ENDERECO DO SITE usado nos links dos e-mails: confirmacao de
 * e-mail, redefinicao de senha e acompanhamento da denuncia.
 *
 * A ordem de preferencia:
 *   1. NEXT_PUBLIC_APP_URL, a configuracao feita pela escola. Mas, rodando
 *      na Vercel, um endereco "localhost" e ignorado: ele so existe no
 *      computador de quem programa, e um link assim chegaria quebrado.
 *   2. O dominio de producao que a propria Vercel informa
 *      (VERCEL_PROJECT_PRODUCTION_URL), ou o endereco da versao de teste
 *      (VERCEL_URL) nas versoes de pre-visualizacao.
 *   3. http://localhost:3000, quando o sistema roda na maquina local.
 *
 * Por que nao usar o endereco que veio no pedido (o cabecalho Host)? Porque
 * ele e informado por quem faz o pedido. Um atacante poderia pedir a
 * redefinicao de senha de outra pessoa com um Host falso e fazer o link
 * enviado a ela apontar para um site dele, roubando o codigo do link.
 *
 * Para a apresentacao: pode pular, e um detalhe de configuracao.
 */

export function getAppUrl() {
  const naVercel = Boolean(process.env.VERCEL);
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim();

  // BLOCO 1 - O endereco configurado, se fizer sentido onde o site esta.
  if (configurada && !(naVercel && /localhost|127\.0\.0\.1/.test(configurada))) {
    return semBarraFinal(configurada);
  }

  // BLOCO 2 - Na Vercel: o dominio de producao, ou o da versao de teste.
  const dominioVercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (naVercel && dominioVercel) {
    return `https://${semBarraFinal(dominioVercel)}`;
  }

  // BLOCO 3 - Na maquina local.
  return configurada ? semBarraFinal(configurada) : "http://localhost:3000";
}

// Tira a barra sobrando do fim, evitando o link torto "site.com//acompanhar".
function semBarraFinal(url: string) {
  return url.replace(/\/+$/, "");
}
