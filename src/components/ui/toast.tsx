import { cn } from "@/lib/cn";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
};

export function Toast({ title, description, variant = "info" }: ToastProps) {
  return (
    <div
      className={cn(
        "surface-neuro-sm flex gap-3 border p-4",
        variant === "success" && "border-[#2E8B57]/30",
        variant === "error" && "border-danger-600/30",
        variant === "info" && "border-ocean-600/25"
      )}
      role="status"
    >
      <span
        className={cn(
          "mt-1 h-3 w-3 shrink-0 rounded-full",
          variant === "success" && "bg-[#2E8B57]",
          variant === "error" && "bg-danger-600",
          variant === "info" && "bg-ocean-600"
        )}
        aria-hidden="true"
      />
      <div>
        <p className="font-bold">{title}</p>
        {description && <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
