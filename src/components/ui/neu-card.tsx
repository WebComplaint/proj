/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o cartao branco usado como caixa de conteudo em praticamente todas as
 * telas, com titulo e descricao opcionais.
 *
 * Para a apresentacao: pode pular, e a caixa padrao do layout.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type NeuCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "flat" | "raised" | "pressed";
};

// BLOCO 1 - O cartao aceita tres estilos de profundidade:
//   raised  = com sombra, parece levantado (o padrao).
//   pressed = parece afundado, usado em areas de destaque.
//   flat    = so com borda, quando a tela ja tem muita sombra.
export function NeuCard({
  as: Component = "section",
  title,
  description,
  action,
  variant = "raised",
  className,
  children,
  ...props
}: NeuCardProps) {
  return (
    <Component
      className={cn(
        "rounded-calm bg-base p-5 text-text-primary transition-[box-shadow,transform] duration-200 ease-calm",
        variant === "raised" && "shadow-neuro",
        variant === "pressed" && "shadow-neuro-inset",
        variant === "flat" && "border border-ocean-600/15",
        className
      )}
      {...props}
    >
      {/* BLOCO 2 - O cabecalho so e desenhado se houver titulo, descricao ou
          botao. Sem isso, um cartao usado apenas como caixa ficaria com um
          espaco vazio no topo. */}
      {(title || description || action) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </Component>
  );
}
