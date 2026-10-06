/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Sao os campos de digitar do sistema: a linha unica (NeuInput) e a caixa
 * de texto grande (NeuTextarea).
 *
 * Cada campo ja vem com rotulo, espaco para mensagem de erro e as marcacoes
 * que os leitores de tela usam para anunciar o erro a uma pessoa cega. Como
 * todo formulario usa estes campos, a acessibilidade vale para o sistema
 * inteiro sem ninguem precisar lembrar disso em cada tela.
 *
 * Para a apresentacao: acessibilidade embutida na base do projeto.
 */

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

// BLOCO 1 - O que todo campo do sistema tem:
//   label = o titulo acima do campo (obrigatorio, sem excecao);
//   error = a mensagem em vermelho quando algo esta errado;
//   hint  = uma dica em cinza, quando ajuda a explicar o que preencher.
type FieldBaseProps = {
  label: string;
  error?: string;
  hint?: string;
};

type NeuInputProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;
type NeuTextareaProps = FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

// BLOCO 2 - O campo de uma linha (nome, e-mail, protocolo, etc).
export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ label, error, hint, id, className, disabled, ...props }, ref) => {
    // Cria um identificador unico para o campo. Ele liga o titulo ao campo:
    // clicar no titulo "E-mail" ja posiciona o cursor no campo certo.
    const inputId = id ?? props.name;

    // Cria o identificador da mensagem de erro ou da dica, usado logo abaixo.
    const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="grid gap-2">
        <label className="text-sm font-bold text-text-secondary" htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          // ESTAS DUAS LINHAS SAO A ACESSIBILIDADE DO SISTEMA INTEIRO.
          // aria-describedby liga o campo a sua mensagem de erro, para que o
          //   leitor de tela leia o motivo do erro, e nao apenas "campo".
          // aria-invalid marca o campo como incorreto, e o leitor anuncia isso
          //   assim que a pessoa chega nele.
          // Como todos os formularios usam este componente, uma pessoa cega
          // consegue preencher qualquer tela do sistema.
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className={cn(
            "field-inset w-full px-4 py-3 transition-[border-color,box-shadow] duration-200 ease-calm disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-danger-600 text-danger-600",
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p id={descriptionId} className={cn("text-sm leading-5", error ? "text-danger-600" : "text-text-secondary")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);

NeuInput.displayName = "NeuInput";

// BLOCO 3 - A caixa de texto grande, para o relato da denuncia e para os
// comentarios da equipe. Funciona igual ao campo de uma linha, com a mesma
// estrutura de titulo, erro e marcacoes de acessibilidade.
export const NeuTextarea = forwardRef<HTMLTextAreaElement, NeuTextareaProps>(
  ({ label, error, hint, id, className, disabled, ...props }, ref) => {
    const textareaId = id ?? props.name;
    const descriptionId = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="grid gap-2">
        <label className="text-sm font-bold text-text-secondary" htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className={cn(
            "field-inset min-h-32 w-full resize-y px-4 py-3 transition-[border-color,box-shadow] duration-200 ease-calm disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-danger-600 text-danger-600",
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p id={descriptionId} className={cn("text-sm leading-5", error ? "text-danger-600" : "text-text-secondary")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);

NeuTextarea.displayName = "NeuTextarea";
