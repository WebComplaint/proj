import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type NeuSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const NeuSelect = forwardRef<HTMLSelectElement, NeuSelectProps>(
  ({ label, error, hint, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    const descriptionId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

    return (
      <div className="grid gap-2">
        <label className="text-sm font-bold text-text-secondary" htmlFor={selectId}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={cn(
            "field-inset w-full appearance-none px-4 py-3 transition-[border-color,box-shadow] duration-200 ease-calm disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-danger-600 text-danger-600",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {(error || hint) && (
          <p id={descriptionId} className={cn("text-sm leading-5", error ? "text-danger-600" : "text-text-secondary")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);

NeuSelect.displayName = "NeuSelect";
