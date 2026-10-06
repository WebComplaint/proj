/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a mensagem exibida quando uma lista esta vazia ou uma busca nao achou
 * nada.
 *
 * Em vez de deixar a tela em branco, ela explica o motivo e oferece um
 * proximo passo, como limpar os filtros ou digitar o protocolo de novo.
 *
 * Para a apresentacao: tela vazia tambem precisa conversar com o usuario.
 */

import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
};

// BLOCO UNICO - A mensagem de "nao ha nada aqui".
// Ela sempre tem tres partes: o que aconteceu (title), por que (text) e o que
// fazer agora (action). Uma tela vazia sem explicacao parece defeito; com
// essas tres partes, ela vira uma orientacao.
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
