/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a janela de confirmacao que aparece sobre a tela. Hoje ela e usada
 * apenas na pagina de vitrine dos componentes, ficando disponivel para
 * telas futuras.
 *
 * Para a apresentacao: pode pular.
 */

import type { ReactNode } from "react";
import { NeuButton } from "@/components/ui/neu-button";

type ModalProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

// BLOCO UNICO - A janela de confirmacao.
// As marcacoes role="dialog" e aria-modal avisam ao leitor de tela que uma
// janela abriu por cima do conteudo e que a atencao deve ir para ela.
// Os botoes aparecem em ordem invertida no celular (flex-col-reverse), para
// que o botao de confirmar fique embaixo, mais perto do polegar.
export function Modal({
  title,
  description,
  children,
  confirmLabel = "Salvar alterações",
  cancelLabel = "Cancelar"
}: ModalProps) {
  return (
    <div className="rounded-cloud bg-ocean-900/20 p-4">
      <section className="mx-auto max-w-lg rounded-cloud bg-base p-6 shadow-neuro-lg" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
        <h2 id="demo-modal-title" className="text-2xl font-bold">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NeuButton variant="ghost">{cancelLabel}</NeuButton>
          <NeuButton>{confirmLabel}</NeuButton>
        </div>
      </section>
    </div>
  );
}
