"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Sao os dois formularios das telas de administracao:
 *   UsuarioForm   -> cria e edita membros do corpo docente.
 *   CategoriaForm -> cria e edita categorias de denuncia.
 *
 * Os dois usam o mesmo truque: o MESMO formulario serve para criar e para
 * editar. Se ele recebe um registro existente, ja vem preenchido e envia a
 * alteracao. Se nao recebe nada, vem em branco e cria um novo.
 *
 * No formulario de usuario, deixar o campo de senha em branco mantem a
 * senha atual. Isso permite corrigir o nome ou o cargo de alguem sem
 * precisar redefinir a senha da pessoa.
 *
 * Para a apresentacao: menos telas para manter, mesmo resultado.
 */

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

// ============================================================
// PRIMEIRO FORMULARIO: CORPO DOCENTE
// ============================================================
// O "usuario?" com interrogacao significa que ele e opcional.
// Recebendo um usuario, o formulario EDITA aquela pessoa.
// Sem receber nada, ele CRIA uma pessoa nova. Um formulario, dois usos.
export function UsuarioForm({ usuario }: { usuario?: UsuarioListItem }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Recolhe o que foi digitado nos campos e monta o pacote de envio.
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: usuario?.id,
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      perfil: String(formData.get("perfil") ?? "PROFESSOR"),
      ativo: formData.get("ativo") === "on"
    };
    // AQUI ESTA O TRUQUE DOS DOIS USOS.
    // Editando alguem (existe usuario), envia PATCH, que significa alterar.
    // Criando alguem (nao existe), envia POST, que significa criar.
    // O mesmo formulario, o mesmo endereco, e apenas o verbo muda.
    const response = await fetch("/api/painel/usuarios", {
      method: usuario ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    // Deu erro: mostra a primeira mensagem de campo, se houver, ou a mensagem
    // geral. Uma de cada vez e mais facil de resolver do que uma lista inteira.
    if (!response.ok) {
      setError(result.campos ? Object.values(result.campos)[0] : result.erro);
      setLoading(false);
      return;
    }

    // Deu certo: limpa os campos e manda a pagina recarregar os dados, para o
    // registro novo (ou alterado) aparecer na lista logo abaixo.
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
        {/* O CAMPO DE SENHA MUDA CONFORME O USO.
            Criando: "Senha inicial", obrigatoria, minimo de 10 caracteres.
            Editando: "Nova senha", opcional. Deixando em branco, a senha atual
            e mantida, e o administrador consegue corrigir o nome ou o cargo de
            alguem sem precisar redefinir a senha da pessoa. */}
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
      {/* Nao existe botao de excluir usuario, apenas esta caixinha.
          Desmarcar corta o acesso da pessoa, mas mantem o nome dela no
          historico dos casos que ela tratou. Excluir de verdade apagaria a
          rastreabilidade de quem tomou cada decisao. */}
      <NeuCheckbox label="Usuário ativo" name="ativo" defaultChecked={usuario?.ativo ?? true} />
      <NeuButton loading={loading} type="submit">
        {usuario ? "Salvar usuário" : "Criar usuário"}
      </NeuButton>
    </form>
  );
}

// ============================================================
// SEGUNDO FORMULARIO: CATEGORIAS
// ============================================================
// Funciona exatamente como o de usuario: recebendo uma categoria, edita;
// sem receber nada, cria uma nova.
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

    // Deu erro: mostra a primeira mensagem de campo, se houver, ou a mensagem
    // geral. Uma de cada vez e mais facil de resolver do que uma lista inteira.
    if (!response.ok) {
      setError(result.campos ? Object.values(result.campos)[0] : result.erro);
      setLoading(false);
      return;
    }

    // Deu certo: limpa os campos e manda a pagina recarregar os dados, para o
    // registro novo (ou alterado) aparecer na lista logo abaixo.
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
        {/* O "slug" e o apelido tecnico da categoria, sem acento e sem espaco.
            E ele que vai parar no endereco dos filtros do painel. Por isso o
            exemplo mostrado e violencia_fisica, e nao "Violência física". */}
        <NeuInput label="Slug" name="slug" defaultValue={categoria?.slug} placeholder="violencia_fisica" required />
        <NeuInput label="Ícone" name="icone" defaultValue={categoria?.icone ?? ""} placeholder="V" />
        <NeuInput label="Ordem" name="ordem" type="number" min={0} defaultValue={categoria?.ordem ?? 0} />
        {/* A prioridade padrao define com que urgencia as denuncias desta
            categoria ja nascem no painel. E aqui que a escola registra que,
            para ela, um certo tipo de caso e sempre grave. */}
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
