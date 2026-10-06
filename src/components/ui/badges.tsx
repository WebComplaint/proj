/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Desenha as etiquetas coloridas de status (Recebida, Em analise, Em
 * andamento, Resolvida, Arquivada) e de prioridade (Baixa, Media, Alta,
 * Urgente).
 *
 * Detalhe de acessibilidade que vale citar: a etiqueta sempre traz o nome
 * escrito, e nao apenas a cor. Uma pessoa daltonica nao consegue distinguir
 * verde de vermelho, mas le "Resolvida" sem dificuldade.
 *
 * Para a apresentacao: cor nunca e a unica fonte de informacao.
 */

import { cn } from "@/lib/cn";

export type StatusDenunciaUi = "recebida" | "em_analise" | "em_andamento" | "resolvida" | "arquivada";
export type PrioridadeUi = "baixa" | "media" | "alta" | "urgente";

// BLOCO 1 - A tabela de aparencia de cada status.
// Para cada um: o texto lido na tela, as cores de fundo e a cor da bolinha.
// Repare que TODOS tem "label". A cor acompanha a etiqueta, mas nunca e a
// unica informacao: quem nao distingue cores le a palavra do mesmo jeito.
const statusMap: Record<StatusDenunciaUi, { label: string; className: string; dot: string }> = {
  recebida: { label: "Recebida", className: "bg-sand-100 text-ink-900", dot: "bg-[#D9B800]" },
  em_analise: { label: "Em análise", className: "bg-aqua-300 text-ink-900", dot: "bg-ocean-600" },
  em_andamento: { label: "Em andamento", className: "bg-turquoise-500 text-ink-900", dot: "bg-ocean-800" },
  resolvida: { label: "Resolvida", className: "bg-mint-200 text-ink-900", dot: "bg-[#2E8B57]" },
  arquivada: { label: "Arquivada", className: "bg-[#D8E4E6] text-ink-600", dot: "bg-ink-400" }
};

// BLOCO 2 - A mesma tabela para os niveis de prioridade.
// So a urgente usa vermelho, o que a faz saltar aos olhos na lista do painel.
const prioridadeMap: Record<PrioridadeUi, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-[#D8E4E6] text-ink-600" },
  media: { label: "Média", className: "bg-aqua-300 text-ink-900" },
  alta: { label: "Alta", className: "bg-sand-100 text-ink-900" },
  urgente: { label: "Urgente", className: "bg-danger-100 text-danger-600" }
};

// BLOCO 3 - Desenha a etiqueta de status: bolinha colorida mais o texto.
// O aria-hidden na bolinha faz o leitor de tela ignora-la, para nao anunciar
// "imagem" antes da palavra. Quem le so ouve "Em análise".
export function StatusBadge({ status, className }: { status: StatusDenunciaUi; className?: string }) {
  const item = statusMap[status];

  return (
    <span className={cn("inline-flex min-h-7 items-center gap-2 rounded-full px-3 text-sm font-bold", item.className, className)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", item.dot)} aria-hidden="true" />
      {item.label}
    </span>
  );
}

// BLOCO 4 - Desenha a etiqueta de prioridade.
// Ela escreve "Prioridade alta", e nao apenas "Alta". Sozinha, a palavra
// "Alta" ao lado de "Em análise" poderia ser lida como outro status.
export function PrioridadeBadge({ prioridade, className }: { prioridade: PrioridadeUi; className?: string }) {
  const item = prioridadeMap[prioridade];

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-sm font-bold", item.className, className)}>
      Prioridade {item.label.toLowerCase()}
    </span>
  );
}
