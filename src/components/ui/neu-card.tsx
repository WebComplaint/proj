import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type NeuCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "flat" | "raised" | "pressed";
};

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
