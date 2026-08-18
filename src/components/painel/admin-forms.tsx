"use client";

import type { Categoria, Perfil, Prioridade } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { NeuButton, NeuCheckbox, NeuInput, NeuSelect, NeuTextarea } from "@/components/ui";
import { prioridadeOptions } from "@/lib/denuncias";

type UsuarioListItem = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

export function UsuarioForm({ usuario }: { usuario?: UsuarioListItem }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      id: usuario?.id,
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      perfil: String(formData.get("perfil") ?? "PROFESSOR"),
      ativo: formData.get("ativo") === "on"
    };
    const response = await fetch("/api/painel/usuarios", {
      method: usuario ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.campos ? Object.values(result.campos)[0] : result.erro);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {error && (
        <p className="rounded-soft bg-danger-100 p-3 text-sm font-bold text-danger-600" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NeuInput label="Nome" name="nome" defaultValue={usuario?.nome} required />
        <NeuInput label="E-mail" name="email" type="email" defaultValue={usuario?.email} required />
        <NeuInput
          label={usuario ? "Nova senha" : "Senha inicial"}
          name="senha"
          type="password"
          placeholder={usuario ? "Deixe em branco para manter" : "Mínimo de 10 caracteres"}
          required={!usuario}
        />
        <NeuSelect label="Função no corpo docente" name="perfil" defaultValue={usuario?.perfil ?? "PROFESSOR"}>
          <option value="PROFESSOR">Professor</option>
          <option value="COORDENADOR">Coordenador</option>
          <option value="DIRETOR">Diretor</option>
          <option value="ADMIN">Administrador</option>
        </NeuSelect>
      </div>
      <NeuCheckbox label="Usuário ativo" name="ativo" defaultChecked={usuario?.ativo ?? true} />
      <NeuButton loading={loading} type="submit">
        {usuario ? "Salvar usuário" : "Criar usuário"}
      </NeuButton>
    </form>
  );
}

export function CategoriaForm({ categoria }: { categoria?: Categoria }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      id: categoria?.id,
      nome: String(formData.get("nome") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      icone: String(formData.get("icone") ?? ""),
      prioridadePadrao: String(formData.get("prioridadePadrao") ?? "MEDIA") as Prioridade,
      ativa: formData.get("ativa") === "on",
      ordem: Number(formData.get("ordem") ?? 0)
    };
    const response = await fetch("/api/painel/categorias", {
      method: categoria ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.campos ? Object.values(result.campos)[0] : result.erro);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {error && (
        <p className="rounded-soft bg-danger-100 p-3 text-sm font-bold text-danger-600" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NeuInput label="Nome" name="nome" defaultValue={categoria?.nome} required />
        <NeuInput label="Slug" name="slug" defaultValue={categoria?.slug} placeholder="violencia_fisica" required />
        <NeuInput label="Ícone" name="icone" defaultValue={categoria?.icone ?? ""} placeholder="V" />
        <NeuInput label="Ordem" name="ordem" type="number" min={0} defaultValue={categoria?.ordem ?? 0} />
        <NeuSelect label="Prioridade padrão" name="prioridadePadrao" defaultValue={categoria?.prioridadePadrao ?? "MEDIA"}>
          {prioridadeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NeuSelect>
      </div>
      <NeuTextarea label="Descrição" name="descricao" defaultValue={categoria?.descricao ?? ""} />
      <NeuCheckbox label="Categoria ativa" name="ativa" defaultChecked={categoria?.ativa ?? true} />
      <NeuButton loading={loading} type="submit">
        {categoria ? "Salvar categoria" : "Criar categoria"}
      </NeuButton>
    </form>
  );
}
