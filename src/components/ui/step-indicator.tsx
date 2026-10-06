/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a trilha de etapas do topo do formulario de denuncia: Relato, Detalhes,
 * Provas e Envio.
 *
 * Mostrar em que passo a pessoa esta e quantos faltam reduz a ansiedade e a
 * desistencia no meio do preenchimento. Etapas concluidas recebem um visto,
 * e nao apenas uma cor diferente.
 *
 * Para a apresentacao: e um cuidado com quem esta nervoso ao denunciar.
 */

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// BLOCO 1 - Cada etapa tem um nome e uma situacao:
//   completed = ja concluida;
//   current   = a etapa em que a pessoa esta agora;
//   pending   = ainda por vir.
type Step = {
  label: string;
  state: "completed" | "current" | "pending";
};

// BLOCO 2 - Desenha a trilha de etapas no topo do formulario.
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
            {/* Etapa concluida mostra um visto; as demais mostram o numero.
                Assim a diferenca entre elas nao depende so da cor de fundo. */}
            {step.state === "completed" ? "✓" : index + 1}
          </span>
          <span className="text-sm font-bold text-text-primary">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
