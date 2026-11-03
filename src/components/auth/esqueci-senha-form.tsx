"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * O formulario do "esqueci minha senha": a pessoa informa o e-mail e recebe
 * um link para criar uma senha nova.
 *
 * Depois do envio, a tela mostra sempre a mesma mensagem, exista a conta ou
 * nao. E o mesmo cuidado da tela de login: nao revelar quem tem acesso.
 *
 * Para a apresentacao: o primeiro passo para recuperar o acesso.
 */

import Link from "next/link";
import { FormEvent, useState } from "react";
import { NeuButton, NeuInput } from "@/components/ui";

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  // BLOCO 1 - Envia o e-mail para a rota que gera o link.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await fetch("/api/senha/esqueci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = await response.json();

      if (!response.ok) {
        setErro(result.erro ?? "Não foi possível enviar o pedido agora.");
        return;
      }

      setMensagem(result.mensagem);
    } catch {
      setErro("Não foi possível enviar o pedido agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // BLOCO 2 - Pedido feito: mostra a mensagem e o caminho de volta ao login.
  if (mensagem) {
    return (
      <div className="grid gap-4">
        <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset" role="status">
          {mensagem} O link vale por 1 hora. Se não encontrar a mensagem, confira também a pasta de lixo eletrônico.
        </p>
        <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/login">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      {erro && (
        <p className="rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          {erro}
        </p>
      )}
      <NeuInput
        label="E-mail da sua conta"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu.nome@escola.com.br"
        required
      />
      <NeuButton className="w-full" loading={loading} size="lg" type="submit">
        Enviar link de redefinição
      </NeuButton>
      <Link className="text-center text-sm font-bold text-text-secondary underline" href="/login">
        Lembrei a senha, voltar para o login
      </Link>
    </form>
  );
}
