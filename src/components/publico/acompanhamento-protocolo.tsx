"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Busca e exibe a situacao publica de uma denuncia a partir do protocolo.
 *
 * A tela pode estar em quatro situacoes diferentes, e cada uma tem uma
 * mensagem propria:
 *   carregando -> mostra a barra de progresso enquanto consulta;
 *   pronto     -> mostra status, categoria e a linha do tempo publica;
 *   vazio      -> protocolo nao encontrado ou digitado errado;
 *   limitado   -> muitas tentativas, peca para aguardar alguns minutos.
 *
 * Cuidar dessas quatro situacoes e o que separa uma tela que "trava" de uma
 * tela que sempre explica o que esta acontecendo.
 *
 * Para a apresentacao: tudo que aparece aqui e publico por definicao.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, NeuCard, StatusBadge, Timeline } from "@/components/ui";
import type { StatusDenunciaUi } from "@/components/ui";

// BLOCO 1 - O formato dos dados que a API devolve.
// Escrever isso serve para o editor avisar o programador caso ele tente usar
// um campo que a resposta publica nao traz, como a descricao da denuncia.
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

// BLOCO 2 - AS QUATRO SITUACOES POSSIVEIS DA TELA.
// A tela esta sempre em exatamente uma delas, nunca em duas ao mesmo tempo:
//   loading -> consultando o servidor;
//   ready   -> deu certo, ha dados para mostrar;
//   empty   -> protocolo nao encontrado;
//   limited -> excedeu o limite de tentativas.
// Escrever as situacoes assim evita o defeito classico de mostrar "carregando"
// e a mensagem de erro juntos na mesma tela.
type State =
  | { kind: "loading" }
  | { kind: "ready"; data: ApiDenunciaPublica }
  | { kind: "empty"; message: string }
  | { kind: "limited"; message: string };

// BLOCO 3 - Dicionarios de traducao: do codigo do banco para a etiqueta
// colorida e para o texto que a pessoa le.
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
  // A tela comeca sempre em "carregando".
  const [state, setState] = useState<State>({ kind: "loading" });

  // BLOCO 4 - A CONSULTA, disparada assim que a tela abre.
  useEffect(() => {
    // Esta marca resolve um problema real: se a pessoa sair da tela antes de a
    // resposta chegar, a resposta atrasada tentaria desenhar uma tela que nao
    // existe mais. A marca vira falsa na saida e a resposta e descartada.
    let active = true;

    async function load() {
      try {
        // Pede os dados a API publica.
        // O "cache: no-store" obriga a buscar sempre a informacao mais recente.
        // Sem isso, o navegador poderia mostrar um status antigo guardado.
        const response = await fetch(`/api/denuncias/protocolo/${encodeURIComponent(protocolo)}`, {
          cache: "no-store"
        });
        const result = await response.json();

        // A pessoa ja saiu da tela: nao faz nada.
        if (!active) {
          return;
        }

        // SITUACAO 1 - Codigo 429: tentativas demais.
        // Tratado separadamente porque nao e erro da pessoa, e a mensagem
        // precisa ser "aguarde alguns minutos", e nao "protocolo invalido".
        if (response.status === 429) {
          setState({ kind: "limited", message: result.erro });
          return;
        }

        // SITUACAO 2 - Qualquer outro erro: protocolo nao encontrado.
        if (!response.ok) {
          setState({
            kind: "empty",
            message: "Não foi possível mostrar informações para esse protocolo. Confira o código e tente novamente."
          });
          return;
        }

        // SITUACAO 3 - Deu tudo certo: guarda os dados para desenhar a tela.
        setState({ kind: "ready", data: result });
      } catch {
        // SITUACAO 4 - Nem chegou a falar com o servidor. Costuma ser internet
        // caindo, e por isso a mensagem sugere verificar a conexao.
        if (active) {
          setState({
            kind: "empty",
            message: "Não foi possível consultar agora. Verifique sua conexão e tente novamente."
          });
        }
      }
    }

    load();

    // Esta funcao roda quando a pessoa sai da tela: desliga a marca para que
    // uma resposta atrasada seja ignorada.
    return () => {
      active = false;
    };
    // A consulta e refeita sempre que o protocolo da tela muda.
  }, [protocolo]);

  // BLOCO 5 - Transforma o historico recebido nos itens da linha do tempo.
  // Todos ja chegam marcados como "public", porque a API publica nunca envia
  // notas internas. Aqui nao ha filtro nenhum a fazer: a filtragem verdadeira
  // aconteceu no servidor, e nao na tela.
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

  // BLOCO 6 - A TELA MUDA CONFORME A SITUACAO.
  // Os quatro blocos abaixo se excluem: apenas um e desenhado por vez.

  // CARREGANDO: barra de progresso enquanto a resposta nao chega.
  if (state.kind === "loading") {
    return (
      <NeuCard title="Buscando acompanhamento" description="Aguarde um momento enquanto consultamos o protocolo." aria-busy="true">
        <div className="h-3 w-full overflow-hidden rounded-full bg-base shadow-neuro-inset">
          <div className="h-full w-1/3 rounded-full bg-ocean-800 motion-safe:animate-pulse" />
        </div>
      </NeuCard>
    );
  }

  // LIMITE ATINGIDO: explica a espera e oferece os canais de ajuda, para que
  // quem precisa de socorro agora nao fique parado esperando o prazo passar.
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

  // NAO ENCONTRADO: convida a digitar o codigo de novo, em vez de deixar a
  // pessoa sem saber o que fazer.
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

  // TUDO CERTO: mostra protocolo, status, categoria, data e a linha do tempo.
  // Compare esta tela com a de detalhe do painel: la aparecem o relato, os
  // anexos e as notas internas. Aqui, nada disso. E a mesma denuncia vista de
  // dois lugares com permissoes diferentes.
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
