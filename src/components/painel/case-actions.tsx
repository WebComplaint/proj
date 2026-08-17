"use client";

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
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<StatusDenuncia>(status);
  const [nextPrioridade, setNextPrioridade] = useState<Prioridade>(prioridade);
  const [nextResponsavel, setNextResponsavel] = useState(responsavelId ?? "");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

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

    if (!response.ok) {
      setError(result.erro ?? "Não foi possível salvar as alterações.");
      setLoading(false);
      return;
    }

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

export function CommentForm({ denunciaId }: { denunciaId: string }) {
  const router = useRouter();
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
