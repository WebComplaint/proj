"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * O formulario aberto pelo link de "esqueci minha senha": a pessoa digita a
 * senha nova duas vezes e confirma.
 *
 * A senha vai para o servidor, que confere o link e entrega a troca para a
 * funcao protegida do banco. Ela nao e guardada em lugar nenhum do site.
 *
 * Para a apresentacao: o ultimo passo para recuperar o acesso.
 */

import Link from "next/link";
import { FormEvent, useState } from "react";
import { NeuButton, NeuInput } from "@/components/ui";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [concluido, setConcluido] = useState(false);
  const [loading, setLoading] = useState(false);

  // BLOCO 1 - Confere aqui o basico (tamanho e senhas iguais) para avisar
  // rapido, e envia. O servidor repete as mesmas conferencias.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const errosLocais: Record<string, string> = {};
    if (senha.length < 10) errosLocais.senha = "Use uma senha com pelo menos 10 caracteres.";
    if (senha !== confirmacao) errosLocais.confirmacao = "As duas senhas precisam ser iguais.";
    setCampos(errosLocais);
    if (Object.keys(errosLocais).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/senha/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha, confirmacao })
      });
      const result = await response.json();

      if (!response.ok) {
        setCampos(result.campos ?? {});
        setErro(result.erro ?? "Não foi possível trocar a senha agora.");
        return;
      }

      setConcluido(true);
    } catch {
      setErro("Não foi possível trocar a senha agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // BLOCO 2 - Deu certo: leva de volta ao login com a senha nova.
  if (concluido) {
    return (
      <div className="grid gap-4">
        <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset" role="status">
          Senha alterada. Entre no painel usando a senha nova.
        </p>
        <Link className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-4" href="/login">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      {erro && (
        <div className="grid gap-2 rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          <p>{erro}</p>
          {!campos.senha && !campos.confirmacao && (
            <Link className="underline" href="/esqueci-senha">
              Pedir um novo link
            </Link>
          )}
        </div>
      )}
      <NeuInput
        label="Senha nova"
        name="senha"
        type="password"
        autoComplete="new-password"
        value={senha}
        onChange={(event) => setSenha(event.target.value)}
        hint="Use pelo menos 10 caracteres."
        error={campos.senha}
        required
      />
      <NeuInput
        label="Repita a senha nova"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        value={confirmacao}
        onChange={(event) => setConfirmacao(event.target.value)}
        error={campos.confirmacao}
        required
      />
      <NeuButton className="w-full" loading={loading} size="lg" type="submit">
        Salvar senha nova
      </NeuButton>
    </form>
  );
}
