/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Concentra as REGRAS DE NEGOCIO da denuncia. Duas delas sao importantes
 * para a apresentacao:
 *
 * 1) A ESTEIRA DE STATUS (funcao canChangeStatus)
 *    Um caso nao pode pular etapas. De Recebida ele so pode ir para
 *    Em analise ou Arquivada. De Em analise so para Em andamento ou
 *    Arquivada. Isso impede que alguem marque como Resolvida uma denuncia
 *    que nunca foi analisada.
 *
 * 2) O PRAZO DE TRIAGEM (funcao isTriagemAtrasada)
 *    Se uma denuncia fica parada em Recebida por mais de 48 horas, o sistema
 *    a marca como atrasada e a destaca no painel.
 *
 * O resto do arquivo sao traducoes: o banco guarda EM_ANALISE, e a tela
 * mostra "Em analise" para a pessoa ler.
 */

import type { Prioridade, StatusDenuncia } from "@prisma/client";
import type { PrioridadeUi, StatusDenunciaUi } from "@/components/ui";

// BLOCO 1 - Os 5 status possiveis de uma denuncia.
// "value" e como o banco guarda (EM_ANALISE, tudo junto e em maiusculas).
// "label" e como a pessoa le na tela ("Em análise", com acento e espaco).
// Essa separacao existe porque banco de dados nao lida bem com acentos e
// espacos, mas a tela precisa deles para ficar legivel.
export const statusOptions: Array<{ value: StatusDenuncia; label: string }> = [
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "RESOLVIDA", label: "Resolvida" },
  { value: "ARQUIVADA", label: "Arquivada" }
];

// BLOCO 2 - Os 4 niveis de prioridade, na mesma logica do bloco anterior.
export const prioridadeOptions: Array<{ value: Prioridade; label: string }> = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" }
];

// BLOCO 3 - Tabelas de traducao entre o nome do banco e o nome usado pelas
// etiquetas coloridas da tela. Sao dicionarios simples: procure a palavra da
// esquerda e receba a da direita.
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

// BLOCO 4 - Monta automaticamente o dicionario "codigo do banco -> texto da
// tela" a partir das listas dos blocos 1 e 2.
// Poderia ter sido escrito na mao, mas assim, ao acrescentar um status novo
// la em cima, a traducao aparece sozinha aqui. Menos chance de esquecer.
export const statusLabelMap = Object.fromEntries(
  statusOptions.map((status) => [status.value, status.label])
) as Record<StatusDenuncia, string>;

export const prioridadeLabelMap = Object.fromEntries(
  prioridadeOptions.map((prioridade) => [prioridade.value, prioridade.label])
) as Record<Prioridade, string>;

// BLOCO 5 - A ESTEIRA DO PROCESSO. Este e o coracao das regras de negocio.
// Cada linha diz: estando neste status, para quais outros o caso pode ir.
//
//   RECEBIDA     -> so pode ir para Em analise ou ser Arquivada.
//   EM_ANALISE   -> so pode ir para Em andamento ou ser Arquivada.
//   EM_ANDAMENTO -> so pode ir para Resolvida ou ser Arquivada.
//   RESOLVIDA    -> pode voltar para Em andamento (o caso reabriu).
//   ARQUIVADA    -> pode voltar para Em andamento (a escola mudou de ideia).
//
// Repare que RECEBIDA nao tem RESOLVIDA na lista. Ou seja: e impossivel
// marcar como resolvida uma denuncia que ninguem sequer analisou.
const allowedNextStatus: Record<StatusDenuncia, StatusDenuncia[]> = {
  RECEBIDA: ["EM_ANALISE", "ARQUIVADA"],
  EM_ANALISE: ["EM_ANDAMENTO", "ARQUIVADA"],
  EM_ANDAMENTO: ["RESOLVIDA", "ARQUIVADA"],
  RESOLVIDA: ["EM_ANDAMENTO", "ARQUIVADA"],
  ARQUIVADA: ["EM_ANDAMENTO"]
};

// BLOCO 6 - Consulta a esteira acima: esta mudanca de status e permitida?
export function canChangeStatus(from: StatusDenuncia, to: StatusDenuncia) {
  // Salvar mantendo o mesmo status e sempre permitido. Acontece quando a
  // pessoa mexeu so na prioridade ou no responsavel.
  if (from === to) {
    return true;
  }

  // Procura o destino desejado na lista de destinos permitidos.
  return allowedNextStatus[from].includes(to);
}

// BLOCO 7 - O PRAZO DE TRIAGEM (o chamado SLA).
// Responde: este caso esta parado ha tempo demais sem ninguem olhar?
export function isTriagemAtrasada(status: StatusDenuncia, criadoEm: Date, now = new Date()) {
  // So faz sentido para casos ainda nao analisados. Um caso em andamento ja
  // esta recebendo atencao da equipe.
  if (status !== "RECEBIDA") {
    return false;
  }

  // Compara a idade do caso com 48 horas.
  // A conta 48 * 60 * 60 * 1000 e 48 horas x 60 minutos x 60 segundos x 1000,
  // porque o computador mede tempo em milissegundos.
  return now.getTime() - criadoEm.getTime() > 48 * 60 * 60 * 1000;
}

// BLOCO 8 - Escreve a data no jeito brasileiro: 09/09/2026 14:30.
// O padrao interno do sistema seria 2026-09-09T14:30:00Z, ilegivel para quem
// nao e da area. O "pt-BR" ajusta dia/mes/ano e o relogio de 24 horas.
export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

// BLOCO 9 - Escreve o tamanho do arquivo de um jeito que a pessoa entende.
// O computador conta em bytes: um anexo pode ter 2.411.724 bytes.
// Aqui isso vira "2.3 MB". Arquivos pequenos aparecem em KB, e o Math.max(1)
// evita mostrar "0 KB" para um arquivo minusculo, o que pareceria erro.
export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
