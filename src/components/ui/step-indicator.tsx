import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Step = {
  label: string;
  state: "completed" | "current" | "pending";
};

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-[repeat(var(--step-count),minmax(0,1fr))]" style={{ "--step-count": steps.length } as CSSProperties}>
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              step.state === "completed" && "bg-ocean-800 text-white",
              step.state === "current" && "bg-aqua-300 text-ocean-900 shadow-neuro-sm",
              step.state === "pending" && "bg-base text-text-secondary shadow-neuro-inset"
            )}
          >
            {step.state === "completed" ? "✓" : index + 1}
          </span>
          <span className="text-sm font-bold text-text-primary">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
