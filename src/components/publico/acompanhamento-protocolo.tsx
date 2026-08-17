"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, NeuCard, StatusBadge, Timeline } from "@/components/ui";
import type { StatusDenunciaUi } from "@/components/ui";

type ApiHistorico = {
  statusAnterior: string | null;
  statusNovo: string | null;
  comentario: string | null;
  criadoEm: string;
};

type ApiDenunciaPublica = {
  protocolo: string;
  status: string;
  prioridade: string;
  criadoEm: string;
  categoria: {
    nome: string;
    slug: string;
  };
  historico: ApiHistorico[];
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: ApiDenunciaPublica }
  | { kind: "empty"; message: string }
  | { kind: "limited"; message: string };

const statusToUi: Record<string, StatusDenunciaUi> = {
  RECEBIDA: "recebida",
  EM_ANALISE: "em_analise",
  EM_ANDAMENTO: "em_andamento",
  RESOLVIDA: "resolvida",
  ARQUIVADA: "arquivada"
};

const statusLabels: Record<string, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
  ARQUIVADA: "Arquivada"
};

export function AcompanhamentoProtocolo({ protocolo }: { protocolo: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/denuncias/protocolo/${encodeURIComponent(protocolo)}`, {
          cache: "no-store"
        });
        const result = await response.json();

        if (!active) {
          return;
        }

        if (response.status === 429) {
          setState({ kind: "limited", message: result.erro });
          return;
        }

        if (!response.ok) {
          setState({
            kind: "empty",
            message: "Não foi possível mostrar informações para esse protocolo. Confira o código e tente novamente."
          });
          return;
        }

        setState({ kind: "ready", data: result });
      } catch {
        if (active) {
          setState({
            kind: "empty",
            message: "Não foi possível consultar agora. Verifique sua conexão e tente novamente."
          });
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [protocolo]);

  const timelineItems = useMemo(() => {
    if (state.kind !== "ready") {
      return [];
    }

    return state.data.historico.map((item) => ({
      title: item.statusNovo ? `Status atualizado para ${statusLabels[item.statusNovo] ?? item.statusNovo}` : "Resposta da escola",
      description: item.comentario || "A equipe registrou uma atualização pública para o caso.",
      date: formatDate(item.criadoEm),
      visibility: "public" as const
    }));
  }, [state]);

  if (state.kind === "loading") {
    return (
      <NeuCard title="Buscando acompanhamento" description="Aguarde um momento enquanto consultamos o protocolo." aria-busy="true">
        <div className="h-3 w-full overflow-hidden rounded-full bg-base shadow-neuro-inset">
          <div className="h-full w-1/3 rounded-full bg-ocean-800 motion-safe:animate-pulse" />
        </div>
      </NeuCard>
    );
  }

  if (state.kind === "limited") {
    return (
      <EmptyState
        title="Aguarde antes de tentar de novo"
        text={state.message}
        action={
          <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-4" href="/ajuda">
            Ver canais de ajuda
          </Link>
        }
      />
    );
  }

  if (state.kind === "empty") {
    return (
      <EmptyState
        title="Não foi possível mostrar o acompanhamento"
        text={state.message}
        action={
          <Link className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-4" href="/acompanhar">
            Digitar protocolo novamente
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <NeuCard>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="protocol text-sm font-bold text-text-secondary">{state.data.protocolo}</p>
            <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
              Acompanhamento da denúncia
            </h1>
          </div>
          <StatusBadge status={statusToUi[state.data.status] ?? "recebida"} />
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoItem label="Categoria" value={state.data.categoria.nome} />
          <InfoItem label="Data de abertura" value={formatDate(state.data.criadoEm)} />
        </dl>
      </NeuCard>

      <NeuCard title="Linha do tempo pública" description="Apenas mudanças de status e respostas marcadas como públicas aparecem aqui.">
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Ainda não há atualizações públicas além do registro inicial.
          </p>
        )}
      </NeuCard>

      <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-fit" href="/acompanhar">
        Consultar outro protocolo
      </Link>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soft bg-base p-4 shadow-neuro-inset">
      <dt className="text-sm font-bold text-text-secondary">{label}</dt>
      <dd className="mt-1 text-base font-bold text-text-primary">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
