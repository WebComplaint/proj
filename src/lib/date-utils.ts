/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tres contas simples com datas, usadas pelos graficos do painel.
 * Elas transformam uma data completa em uma "etiqueta de mes" como 2026-03,
 * que e o formato usado para agrupar as denuncias mes a mes.
 *
 * Para a apresentacao: pode pular, e um detalhe de calendario.
 */

// BLOCO 1 - Volta uma quantidade de meses no calendario.
// Usado para descobrir onde comeca o grafico dos ultimos 6 meses.
// Sempre devolve o dia 1, porque o grafico agrupa por mes inteiro.
export function subMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() - amount, 1);
}

// BLOCO 2 - Transforma uma data completa em uma etiqueta de mes: "2026-03".
// O padStart(2, "0") garante o zero na frente, para marco virar 03 e nao 3.
// Isso mantem todas as etiquetas do mesmo tamanho e faceis de comparar.
export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// BLOCO 3 - Atalho que devolve a etiqueta do mes de uma data qualquer.
// Serve para responder: "esta denuncia caiu em qual mes do grafico?".
export function startOfMonthKey(date: Date) {
  return toMonthKey(new Date(date.getFullYear(), date.getMonth(), 1));
}
