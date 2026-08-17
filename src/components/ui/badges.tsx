import { cn } from "@/lib/cn";

export type StatusDenunciaUi = "recebida" | "em_analise" | "em_andamento" | "resolvida" | "arquivada";
export type PrioridadeUi = "baixa" | "media" | "alta" | "urgente";

const statusMap: Record<StatusDenunciaUi, { label: string; className: string; dot: string }> = {
  recebida: { label: "Recebida", className: "bg-sand-100 text-ink-900", dot: "bg-[#D9B800]" },
  em_analise: { label: "Em análise", className: "bg-aqua-300 text-ink-900", dot: "bg-ocean-600" },
  em_andamento: { label: "Em andamento", className: "bg-turquoise-500 text-ink-900", dot: "bg-ocean-800" },
  resolvida: { label: "Resolvida", className: "bg-mint-200 text-ink-900", dot: "bg-[#2E8B57]" },
  arquivada: { label: "Arquivada", className: "bg-[#D8E4E6] text-ink-600", dot: "bg-ink-400" }
};

const prioridadeMap: Record<PrioridadeUi, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-[#D8E4E6] text-ink-600" },
  media: { label: "Média", className: "bg-aqua-300 text-ink-900" },
  alta: { label: "Alta", className: "bg-sand-100 text-ink-900" },
  urgente: { label: "Urgente", className: "bg-danger-100 text-danger-600" }
};

export function StatusBadge({ status, className }: { status: StatusDenunciaUi; className?: string }) {
  const item = statusMap[status];

  return (
    <span className={cn("inline-flex min-h-7 items-center gap-2 rounded-full px-3 text-sm font-bold", item.className, className)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", item.dot)} aria-hidden="true" />
      {item.label}
    </span>
  );
}

export function PrioridadeBadge({ prioridade, className }: { prioridade: PrioridadeUi; className?: string }) {
  const item = prioridadeMap[prioridade];

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-sm font-bold", item.className, className)}>
      Prioridade {item.label.toLowerCase()}
    </span>
  );
}
