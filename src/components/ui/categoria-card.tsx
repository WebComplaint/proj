/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o cartao clicavel de categoria da primeira etapa do formulario.
 *
 * Quando selecionado, ele muda de aparencia e tambem informa isso aos
 * leitores de tela pelo atributo aria-pressed, para que uma pessoa cega
 * saiba qual opcao esta marcada.
 *
 * Para a apresentacao: cada peca visual ja nasce acessivel.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CategoriaCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
};

export function CategoriaCard({ title, description, icon, selected = false, className, ...props }: CategoriaCardProps) {
  return (
    <button
      className={cn(
        "min-h-24 rounded-calm bg-base p-4 text-left text-text-primary shadow-neuro-sm transition-[border-color,box-shadow,transform] duration-200 ease-calm",
        "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        // Selecionado: borda mais grossa e aparencia afundada.
        // Sao duas diferencas ao mesmo tempo, borda e sombra, e nao apenas
        // uma mudanca de cor, que passaria despercebida por muita gente.
        selected ? "border-2 border-turquoise-500 shadow-neuro-inset" : "border border-ocean-600/15",
        className
      )}
      type="button"
      // O aria-pressed informa aos leitores de tela se este cartao esta
      // selecionado. Sem ele, uma pessoa cega ouviria os oito cartoes de
      // categoria sem saber qual escolheu.
      aria-pressed={selected}
      {...props}
    >
      {/* O icone e o nome completo ficam lado a lado no topo do cartao.
          O icone e decorativo: o nome ja diz tudo aos leitores de tela. */}
      <span className="flex items-center gap-3">
        {icon && (
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-aqua-300/60 text-ocean-900 shadow-neuro-inset"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <span className="block font-heading text-lg font-bold">{title}</span>
      </span>
      {description && <span className="mt-3 block text-sm leading-5 text-text-secondary">{description}</span>}
    </button>
  );
}
