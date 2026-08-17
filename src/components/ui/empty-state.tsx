import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="surface-neuro grid justify-items-center gap-3 p-8 text-center">
      {icon && <span className="text-4xl" aria-hidden="true">{icon}</span>}
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="max-w-md text-sm leading-6 text-text-secondary">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
