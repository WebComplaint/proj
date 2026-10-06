/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o cartao de numero grande usado no painel e nos relatorios, como "Total
 * do mes: 12".
 *
 * Para a apresentacao: pode pular, e um elemento visual do painel.
 */

import type { ReactNode } from "react";

type StatCardProps = {
  value: string;
  label: string;
  variation?: string;
  icon?: ReactNode;
};

// BLOCO UNICO - O cartao de numero do painel.
//   label     = o titulo pequeno ("Total do mês").
//   value     = o numero grande ("12").
//   variation = a explicacao embaixo ("Denúncias abertas neste mês").
// A explicacao existe porque um numero sozinho nao diz o que ele conta.
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
