/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Ajudante bem pequeno de aparencia visual. Junta varios nomes de estilo em
 * um so texto e descarta os que estao vazios.
 *
 * Serve para escrever coisas como "botao azul, e SE estiver desativado,
 * tambem apagado" sem sujar o codigo com condicoes espalhadas.
 *
 * Para a apresentacao: pode pular, e so um detalhe de organizacao visual.
 */

// BLOCO UNICO - Recebe varios nomes de estilo e devolve um texto so.
// O "..." significa "aceite quantos vierem".
// O filter(Boolean) joga fora os vazios, que aparecem quando uma condicao e falsa.
// Exemplo: cn("botao", errado && "vermelho") vira "botao" quando errado e falso,
// e vira "botao vermelho" quando errado e verdadeiro.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
