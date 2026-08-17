import type { Prioridade, StatusDenuncia } from "@prisma/client";
import type { PrioridadeUi, StatusDenunciaUi } from "@/components/ui";

export const statusOptions: Array<{ value: StatusDenuncia; label: string }> = [
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ARQUIVADA", label: "Arquivada" }
];

export const prioridadeOptions: Array<{ value: Prioridade; label: string }> = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" }
];

export const statusUiMap: Record<StatusDenuncia, StatusDenunciaUi> = {
  RECEBIDA: "recebida",
  EM_ANALISE: "em_analise",
  EM_ANDAMENTO: "em_andamento",
  RESOLVIDA: "resolvida",
  ARQUIVADA: "arquivada"
};

export const prioridadeUiMap: Record<Prioridade, PrioridadeUi> = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
  URGENTE: "urgente"
};

export const statusLabelMap = Object.fromEntries(
  statusOptions.map((status) => [status.value, status.label])
) as Record<StatusDenuncia, string>;

export const prioridadeLabelMap = Object.fromEntries(
  prioridadeOptions.map((prioridade) => [prioridade.value, prioridade.label])
) as Record<Prioridade, string>;

const allowedNextStatus: Record<StatusDenuncia, StatusDenuncia[]> = {
  RECEBIDA: ["EM_ANALISE", "ARQUIVADA"],
  EM_ANALISE: ["EM_ANDAMENTO", "ARQUIVADA"],
  EM_ANDAMENTO: ["RESOLVIDA", "ARQUIVADA"],
  RESOLVIDA: ["EM_ANDAMENTO", "ARQUIVADA"],
  ARQUIVADA: ["EM_ANDAMENTO"]
};

export function canChangeStatus(from: StatusDenuncia, to: StatusDenuncia) {
  if (from === to) {
    return true;
  }

  return allowedNextStatus[from].includes(to);
}

export function isTriagemAtrasada(status: StatusDenuncia, criadoEm: Date, now = new Date()) {
  if (status !== "RECEBIDA") {
    return false;
  }

  return now.getTime() - criadoEm.getTime() > 48 * 60 * 60 * 1000;
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
