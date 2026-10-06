/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o botao padrao do sistema, em quatro estilos e tres tamanhos.
 *
 * Ele resolve sozinho um problema comum: quando esta carregando, o botao se
 * desativa e mostra o giro de espera. Isso impede que a pessoa clique tres
 * vezes em Enviar denuncia e cadastre o mesmo caso tres vezes.
 *
 * A altura minima de 44 pixels tambem nao e por acaso: e a medida
 * recomendada para que o dedo acerte o botao no celular.
 *
 * Para a apresentacao: um botao pensado evita erro do usuario.
 */

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// BLOCO 1 - As opcoes do botao.
// variant = o estilo (principal, secundario, discreto ou de risco).
// size    = o tamanho.
// loading = esta processando algo agora?
// O trecho "ButtonHTMLAttributes &" no inicio significa que ele tambem aceita
// tudo que um botao normal aceita, como onClick e disabled.
type NeuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function NeuButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: NeuButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={cn(
        // O "min-h-11" e a altura minima de 44 pixels. Nao e um numero
        // qualquer: e a medida recomendada para que a ponta do dedo acerte o
        // botao no celular sem errar o alvo.
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-soft font-bold transition-[background,box-shadow,color,transform] duration-200 ease-calm",
        "disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-3 text-sm",
        size === "lg" && "px-5 py-4 text-base",
        variant === "primary" && "bg-ocean-800 text-white shadow-neuro-sm hover:bg-ocean-900",
        variant === "secondary" && "bg-base text-ocean-900 shadow-neuro-sm hover:shadow-neuro-inset",
        variant === "ghost" && "bg-transparent text-ocean-900 hover:bg-white/35",
        variant === "danger" && "bg-danger-100 text-danger-600 shadow-neuro-sm hover:bg-white/50",
        className
      )}
      // ESTE E O DETALHE MAIS IMPORTANTE DO ARQUIVO.
      // Enquanto estiver carregando, o botao se desativa sozinho.
      // Sem isso, alguem ansioso clicaria tres vezes em "Enviar denuncia" e
      // criaria tres denuncias iguais, com tres protocolos diferentes.
      disabled={disabled || loading}
      type={props.type ?? "button"}
      {...props}
    >
      {/* A bolinha girando, que mostra que algo esta acontecendo. */}
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
        />
      )}
      {/* Durante o processamento, o texto do botao vira "Carregando".
          Isso tambem e anunciado por leitores de tela, entao uma pessoa cega
          percebe que o sistema esta trabalhando, e nao travado. */}
      <span>{loading ? "Carregando" : children}</span>
    </button>
  );
}
