/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Desenha o icone de cada categoria de denuncia, escolhido pelo apelido
 * tecnico (slug) da categoria.
 *
 * Os desenhos sao feitos aqui mesmo, em SVG, sem biblioteca externa: sao
 * poucos, leves e herdam a cor do texto ao redor.
 *
 * Para a apresentacao: pode pular, e acabamento visual.
 */

import type { ReactNode } from "react";

// BLOCO 1 - Os tracos de cada icone, no mesmo quadro de 24x24.
const desenhos: Record<string, ReactNode> = {
  // Pessoas: o bullying acontece entre colegas.
  bullying: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  // Celular: o ambiente digital.
  cyberbullying: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  // Escudo com alerta: limite pessoal desrespeitado.
  assedio: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  // Triangulo de alerta: violacao grave.
  abuso: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  // Balanca: tratamento injusto.
  discriminacao: (
    <>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    </>
  ),
  // Raio: impacto fisico.
  violencia_fisica: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  // Balao de mensagem com alerta: ameaca dita ou escrita.
  ameaca: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7v4" />
      <path d="M12 14h.01" />
    </>
  ),
  // Interrogacao: qualquer outra situacao.
  outros: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  )
};

// BLOCO 2 - O icone em si. Categoria sem desenho proprio (por exemplo, uma
// criada depois pelo administrador) recebe o icone de "outros".
export function CategoriaIcone({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {desenhos[slug] ?? desenhos.outros}
    </svg>
  );
}
