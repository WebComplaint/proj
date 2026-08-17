import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CategoriaCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  description?: string;
  icon: ReactNode;
  selected?: boolean;
};

export function CategoriaCard({ title, description, icon, selected = false, className, ...props }: CategoriaCardProps) {
  return (
    <button
      className={cn(
        "min-h-24 rounded-calm bg-base p-4 text-left text-text-primary shadow-neuro-sm transition-[border-color,box-shadow,transform] duration-200 ease-calm",
        "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-2 border-turquoise-500 shadow-neuro-inset" : "border border-ocean-600/15",
        className
      )}
      type="button"
      aria-pressed={selected}
      {...props}
    >
      <span className="mb-3 block text-2xl" aria-hidden="true">
        {icon}
      </span>
      <span className="block text-base font-bold">{title}</span>
      {description && <span className="mt-1 block text-sm leading-5 text-text-secondary">{description}</span>}
    </button>
  );
}
