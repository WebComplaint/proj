/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Gera o codigo de protocolo, no formato DEN-2026-A2B3C4.
 *
 * Dois cuidados foram tomados aqui:
 *
 * 1. O sorteio usa um gerador CRIPTOGRAFICO de numeros aleatorios. Isso
 *    significa que ninguem consegue adivinhar o proximo protocolo e espiar
 *    a denuncia de outra pessoa.
 *
 * 2. O alfabeto nao tem as letras I, L, O nem os numeros 0 e 1. Elas foram
 *    removidas de proposito, porque sao facilmente confundidas quando
 *    alguem anota o codigo no papel.
 *
 * Para a apresentacao: o protocolo e a unica chave de uma denuncia anonima.
 */

// BLOCO 1 - O alfabeto permitido no protocolo.
// Compare com o alfabeto normal e repare no que falta: 0, 1, I, L e O.
// Eles foram retirados de proposito porque sao confundidos quando alguem
// anota o codigo no papel ou dita por telefone (o zero vira letra O, o um
// vira letra L). Menos confusao significa menos protocolo perdido.
const PROTOCOL_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// BLOCO 2 - Monta o codigo no formato DEN-2026-A2B3C4.
export function gerarProtocolo(data = new Date()) {
  // Ano atual, a parte legivel do codigo. Ajuda a saber a idade do caso.
  const year = data.getFullYear();

  // Prepara espaco para 6 numeros sorteados.
  const bytes = new Uint8Array(6);

  // Sorteia de verdade. Este e o ponto mais importante do arquivo:
  // crypto.getRandomValues e um sorteio CRIPTOGRAFICO, imprevisivel.
  // O sorteio comum de programacao (Math.random) segue um padrao e poderia
  // ser calculado por alguem tentando adivinhar protocolos de outras pessoas.
  crypto.getRandomValues(bytes);

  // Converte cada numero sorteado em uma letra do alfabeto seguro acima.
  // O simbolo % faz o numero "dar a volta" e sempre cair dentro do alfabeto.
  const randomPart = Array.from(bytes, (byte) => PROTOCOL_ALPHABET[byte % PROTOCOL_ALPHABET.length]).join("");

  // Junta tudo: prefixo fixo + ano + as 6 letras sorteadas.
  return `DEN-${year}-${randomPart}`;
}
