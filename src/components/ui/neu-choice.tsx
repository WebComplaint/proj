/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Sao as caixinhas de marcar (checkbox) e as bolinhas de escolha (radio).
 *
 * A area clicavel inclui o texto ao lado, e nao apenas o quadradinho. Isso
 * torna o clique muito mais facil no celular.
 *
 * Para a apresentacao: pode pular, e um detalhe de usabilidade.
 */

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type NeuChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  type: "checkbox" | "radio";
  label: string;
  description?: string;
  error?: string;
  icon?: ReactNode;
};

export function NeuChoice({ type, label, description, error, icon, className, id, ...props }: NeuChoiceProps) {
  // BLOCO 1 - Monta um identificador a partir do proprio texto do rotulo.
  // "Usuário ativo" vira "ativo-usuário-ativo". Serve para ligar o texto a
  // caixinha, permitindo clicar em qualquer um dos dois.
  const fallbackId = `${props.name ?? type}-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const choiceId = id ?? fallbackId;
  const errorId = error ? `${choiceId}-error` : undefined;

  return (
    <div>
      <label
        className={cn(
          "flex min-h-11 cursor-pointer items-start gap-3 rounded-soft bg-base p-3 text-text-primary shadow-neuro-sm transition-[box-shadow] duration-200 ease-calm",
          "has-[:checked]:shadow-neuro-inset has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
          error && "border border-danger-600",
          className
        )}
        htmlFor={choiceId}
      >
        <input
          id={choiceId}
          type={type}
          aria-describedby={errorId}
          aria-invalid={Boolean(error)}
          className="mt-1 h-5 w-5 accent-ocean-800"
          {...props}
        />
        {icon && <span className="mt-0.5 text-xl" aria-hidden="true">{icon}</span>}
        <span>
          <span className="block text-sm font-bold">{label}</span>
          {description && <span className="mt-1 block text-sm leading-5 text-text-secondary">{description}</span>}
        </span>
      </label>
      {error && (
        <p id={errorId} className="mt-2 text-sm leading-5 text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

// BLOCO 2 - Dois atalhos para o mesmo componente acima.
// Checkbox: varias opcoes podem ser marcadas ao mesmo tempo.
// Radio: apenas uma opcao do grupo pode ser escolhida.
// O visual e o comportamento acessivel sao identicos nos dois casos.
export function NeuCheckbox(props: Omit<NeuChoiceProps, "type">) {
  return <NeuChoice type="checkbox" {...props} />;
}

export function NeuRadio(props: Omit<NeuChoiceProps, "type">) {
  return <NeuChoice type="radio" {...props} />;
}
