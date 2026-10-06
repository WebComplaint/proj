"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Sao os dois formularios de acao da tela de detalhe de uma denuncia:
 *
 *   CaseActions -> altera status, prioridade e responsavel do caso.
 *   CommentForm -> registra um comentario no historico.
 *
 * No CommentForm, os dois botoes no topo mudam o DESTINO da mensagem:
 * "Nota interna" fica so com a equipe, "Resposta ao denunciante" aparece na
 * consulta publica e dispara e-mail.
 *
 * Por isso, logo abaixo dos botoes, o sistema escreve em texto o que vai
 * acontecer. Escolher errado aqui significaria expor uma nota interna a
 * quem denunciou, entao a interface avisa antes, e nao depois.
 *
 * Para a apresentacao: e onde a equipe efetivamente trabalha o caso.
 */

import type { Prioridade, StatusDenuncia } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { NeuButton, NeuSelect, NeuTextarea } from "@/components/ui";
import { prioridadeOptions, statusOptions } from "@/lib/denuncias";

type ResponsavelOption = {
  id: string;
  nome: string;
};

type CaseActionsProps = {
  denunciaId: string;
  status: StatusDenuncia;
  prioridade: Prioridade;
  responsavelId: string | null;
  responsaveis: ResponsavelOption[];
};

export function CaseActions({
  denunciaId,
  status,
  prioridade,
  responsavelId,
  responsaveis
}: CaseActionsProps) {
  // BLOCO 1 - A memoria do formulario ja comeca com a situacao atual do caso.
  // Por isso os campos aparecem preenchidos com o status e a prioridade que a
  // denuncia tem hoje, e nao em branco.
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<StatusDenuncia>(status);
  const [nextPrioridade, setNextPrioridade] = useState<Prioridade>(prioridade);
  const [nextResponsavel, setNextResponsavel] = useState(responsavelId ?? "");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // BLOCO 2 - O que acontece ao clicar em "Salvar alteracoes".
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Envia as tres mudancas de uma vez para a rota da denuncia.
    // PATCH significa "altere apenas estes campos", e nao "substitua o caso".
    const response = await fetch(`/api/painel/denuncias/${denunciaId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: nextStatus,
        prioridade: nextPrioridade,
        responsavelId: nextResponsavel || null,
        comentario: comentarioStatus || undefined
      })
    });
    const result = await response.json();

    // O servidor pode recusar. O caso mais comum e a mudanca de status nao
    // permitida pela esteira do processo, e a mensagem dele explica isso.
    if (!response.ok) {
      setError(result.erro ?? "Não foi possível salvar as alterações.");
      setLoading(false);
      return;
    }

    // Deu certo: limpa o comentario e manda a pagina buscar os dados de novo.
    // O refresh e o que faz a linha do tempo mostrar a mudanca recem-feita,
    // sem a pessoa precisar recarregar a tela na mao.
    setComentarioStatus("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {error && (
        <p className="rounded-soft border border-danger-600/30 bg-danger-100 p-3 text-sm font-semibold leading-5 text-danger-600" role="alert">
          {error}
        </p>
      )}
      <NeuSelect
        label="Alterar status"
        name="status"
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value as StatusDenuncia)}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NeuSelect>
      <NeuSelect
        label="Prioridade"
        name="prioridade"
        value={nextPrioridade}
        onChange={(event) => setNextPrioridade(event.target.value as Prioridade)}
      >
        {prioridadeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NeuSelect>
      <NeuSelect
        label="Responsável"
        name="responsavel"
        value={nextResponsavel}
        onChange={(event) => setNextResponsavel(event.target.value)}
      >
        <option value="">Sem responsável</option>
        {responsaveis.map((responsavel) => (
          <option key={responsavel.id} value={responsavel.id}>
            {responsavel.nome}
          </option>
        ))}
      </NeuSelect>
      {/* Este comentario vai para a linha do tempo PUBLICA junto com a
          mudanca de status, e a pessoa que denunciou consegue le-lo ao
          consultar o protocolo. O rotulo do campo avisa isso claramente. */}
      <NeuTextarea
        label="Comentário público da mudança"
        name="comentario-status"
        value={comentarioStatus}
        onChange={(event) => setComentarioStatus(event.target.value)}
        placeholder="Explique a mudança de status em uma frase que pode aparecer para quem acompanha o protocolo."
      />
      <NeuButton loading={loading} type="submit">
        Salvar alterações
      </NeuButton>
    </form>
  );
}

// ============================================================
// SEGUNDO FORMULARIO: REGISTRAR COMENTARIO
// ============================================================
export function CommentForm({ denunciaId }: { denunciaId: string }) {
  const router = useRouter();

  // O modo comeca em "interna", a opcao mais segura das duas.
  // Se a pessoa se distrair e nao escolher nada, a mensagem fica com a equipe
  // em vez de ir para quem denunciou. O padrao protege contra o descuido.
  const [mode, setMode] = useState<"internal" | "public">("internal");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch(`/api/painel/denuncias/${denunciaId}/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        comentario,
        // Traduz a escolha dos botoes para verdadeiro/falso.
        // Este unico valor decide se a mensagem fica interna ou se aparece
        // para quem denunciou e ainda dispara um e-mail.
        publico: mode === "public"
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.campos?.comentario ?? result.erro ?? "Não foi possível registrar o comentário.");
      setLoading(false);
      return;
    }

    setComentario("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {/* OS DOIS BOTOES QUE DECIDEM O DESTINO DA MENSAGEM.
          Nao sao dois campos diferentes: e o mesmo texto indo para lugares
          diferentes. Por isso a escolha aparece ANTES do campo de digitar, e
          nao depois. Quem escreve ja sabe para quem esta escrevendo. */}
      <div className="grid gap-3 rounded-calm bg-base p-3 shadow-neuro-inset sm:grid-cols-2" role="group" aria-label="Tipo de comentário">
        <button
          className={`min-h-11 rounded-soft px-4 py-3 text-sm font-bold ${
            mode === "internal" ? "bg-ocean-800 text-white" : "bg-transparent text-ocean-900"
          }`}
          type="button"
          aria-pressed={mode === "internal"}
          onClick={() => setMode("internal")}
        >
          Nota interna
        </button>
        <button
          className={`min-h-11 rounded-soft px-4 py-3 text-sm font-bold ${
            mode === "public" ? "bg-aqua-300 text-ocean-900 shadow-neuro-sm" : "bg-transparent text-ocean-900"
          }`}
          type="button"
          aria-pressed={mode === "public"}
          onClick={() => setMode("public")}
        >
          Resposta ao denunciante
        </button>
      </div>
      {/* A CONFIRMACAO ESCRITA do que vai acontecer.
          A cor dos botoes ja indica a escolha, mas cor sozinha nao basta:
          uma pessoa daltonica, ou alguem com pressa, poderia se enganar.
          Aqui o sistema escreve com todas as letras quem vai ler a mensagem. */}
      <p className="rounded-soft bg-base p-3 text-sm font-semibold leading-5 text-text-secondary shadow-neuro-inset">
        {mode === "internal"
          ? "Nota interna: visível apenas para a equipe."
          : "Resposta ao denunciante: aparece na consulta pública por protocolo."}
      </p>
      {error && (
        <p className="rounded-soft border border-danger-600/30 bg-danger-100 p-3 text-sm font-semibold leading-5 text-danger-600" role="alert">
          {error}
        </p>
      )}
      <NeuTextarea
        label={mode === "internal" ? "Nota interna" : "Resposta ao denunciante"}
        name="comentario"
        value={comentario}
        onChange={(event) => setComentario(event.target.value)}
        placeholder={mode === "internal" ? "Registre uma observação para a equipe." : "Escreva uma resposta que poderá ser vista pelo protocolo."}
      />
      <NeuButton loading={loading} type="submit">
        Registrar comentário
      </NeuButton>
    </form>
  );
}
