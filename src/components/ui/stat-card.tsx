import type { ReactNode } from "react";

type StatCardProps = {
  value: string;
  label: string;
  variation?: string;
  icon?: ReactNode;
};

export function StatCard({ value, label, variation, icon }: StatCardProps) {
  return (
    <article className="surface-neuro-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-text-secondary">{label}</p>
          <strong className="mt-2 block font-heading text-3xl text-text-primary">{value}</strong>
        </div>
        {icon && <span className="text-2xl" aria-hidden="true">{icon}</span>}
      </div>
      {variation && <p className="mt-3 text-sm text-text-secondary">{variation}</p>}
    </article>
  );
}
