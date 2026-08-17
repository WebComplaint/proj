import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

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
      disabled={disabled || loading}
      type={props.type ?? "button"}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
        />
      )}
      <span>{loading ? "Carregando" : children}</span>
    </button>
  );
}
