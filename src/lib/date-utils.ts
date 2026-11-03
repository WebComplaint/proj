/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Contas simples com datas, usadas pelos graficos do painel e pelos limites
 * dos campos de data.
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

// BLOCO 4 - Os LIMITES da data do ocorrido.
// Nao existe denuncia sobre algo que ainda vai acontecer, entao o limite de
// cima e sempre o momento atual. O de baixo barra erros de digitacao, como
// o ano 0202 no lugar de 2020.
export const DATA_MINIMA_OCORRIDO = "2000-01-01T00:00";

// Uma pequena folga para o relogio do computador da pessoa estar alguns
// minutos adiantado em relacao ao do servidor.
export const FOLGA_RELOGIO_MS = 5 * 60 * 1000;

// BLOCO 5 - Escreve uma data no formato que os campos de data do navegador
// entendem, no horario local: 2026-10-16T14:30 (com hora) ou 2026-10-16.
// O toISOString nao serve aqui porque devolve o horario de Londres (UTC), e
// perto da meia-noite o "hoje" sairia como o dia seguinte.
export function toLocalInputValue(date: Date, comHora = true) {
  const dia = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return comHora ? `${dia}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : dia;
}

// BLOCO 6 - A data de HOJE no horario de Brasilia, no formato 2026-10-16.
// Usada no limite dos filtros de periodo do painel. O servidor trabalha no
// horario de Londres (UTC), entao depois das 21h ele ja estaria no dia
// seguinte; o fuso de Sao Paulo evita esse "amanha" antecipado.
export function hojeEmBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
