"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o formulario de e-mail e senha da tela de login.
 *
 * A senha NAO passa pelo nosso servidor: ela vai direto do navegador para o
 * Supabase, o servico especializado que cuida da autenticacao. Nosso codigo
 * so recebe a resposta "entrou" ou "nao entrou".
 *
 * Repare tambem na mensagem de erro: ela diz apenas "E-mail ou senha
 * invalidos", sem revelar qual dos dois errou. Se dissesse "esse e-mail nao
 * existe", alguem poderia descobrir quais e-mails tem conta na escola.
 *
 * Para a apresentacao: seguranca tambem esta na mensagem de erro.
 */

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NeuButton, NeuInput } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();

  // BLOCO 1 - Le do endereco para onde a pessoa queria ir antes de ser
  // barrada pelo porteiro. Sem essa informacao, cai no painel principal.
  // E o que faz alguem clicar em um link de denuncia, fazer login e voltar
  // direto para aquela denuncia, em vez de ter que procurar de novo.
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/painel";

  // BLOCO 2 - A memoria do formulario: e-mail, senha, erro e "carregando".
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // BLOCO 3 - O que acontece ao clicar em "Entrar no painel".
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Envia e-mail e senha DIRETO para o Supabase.
    // Isso e importante: a senha nao passa pelo nosso servidor nem e gravada
    // por nos em lugar nenhum. Quem confere a senha e o servico especializado.
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // DEU ERRO: a mensagem e sempre a mesma, "E-mail ou senha invalidos".
    // Repare no que ela NAO diz. Se dissesse "esse e-mail nao existe", alguem
    // poderia testar enderecos ate descobrir quem trabalha na escola e tem
    // conta no sistema. Uma mensagem unica nao entrega essa informacao.
    if (signInError) {
      setError("E-mail ou senha inválidos. Confira os dados e tente novamente.");
      setLoading(false);
      return;
    }

    // DEU CERTO: leva a pessoa ao destino e recarrega os dados da tela para
    // que o servidor ja a reconheca como logada.
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      {error && (
        <p className="rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          {error}
        </p>
      )}
      <NeuInput
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu.nome@escola.com.br"
        required
      />
      <NeuInput
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Digite sua senha"
        required
      />
      <NeuButton className="w-full" loading={loading} size="lg" type="submit">
        Entrar no painel
      </NeuButton>
      {/* Quem esqueceu a senha pede um link por e-mail para criar outra. */}
      <Link className="text-center text-sm font-bold text-text-secondary underline" href="/esqueci-senha">
        Esqueci minha senha
      </Link>
    </form>
  );
}
