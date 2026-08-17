import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type FieldBaseProps = {
  label: string;
  error?: string;
  hint?: string;
};

type NeuInputProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;
type NeuTextareaProps = FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ label, error, hint, id, className, disabled, ...props }, ref) => {
    const inputId = id ?? props.name;
    const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="grid gap-2">
        <label className="text-sm font-bold text-text-secondary" htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
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
