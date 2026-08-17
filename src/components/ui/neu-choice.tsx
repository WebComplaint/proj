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

export function NeuCheckbox(props: Omit<NeuChoiceProps, "type">) {
  return <NeuChoice type="checkbox" {...props} />;
}

export function NeuRadio(props: Omit<NeuChoiceProps, "type">) {
  return <NeuChoice type="radio" {...props} />;
}
