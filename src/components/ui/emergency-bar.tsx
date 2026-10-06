/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a barra fixa no rodape com os telefones de emergencia: 190, Disque 100,
 * Conselho Tutelar e CVV 188.
 *
 * Ela fica presa na parte de baixo da tela e nao sai da vista conforme a
 * pessoa rola a pagina. E uma decisao de responsabilidade: quem esta em
 * risco imediato precisa de socorro agora, nao de um formulario.
 *
 * Para a apresentacao: e um dos diferenciais eticos do projeto.
 */

type EmergencyBarProps = {
  text?: string;
  actionLabel?: string;
  href?: string;
};

// BLOCO 1 - O texto ja vem escrito por padrao, com os telefones oficiais.
// Quem usa a barra nao precisa lembrar de passar a mensagem: ela e sempre a
// mesma em todas as telas publicas, e o aviso nunca sai do ar por descuido.
export function EmergencyBar({
  text = "Esta plataforma não substitui atendimento de emergência. Em risco imediato: 190, Disque 100, Conselho Tutelar ou CVV 188.",
  actionLabel = "Ver ajuda",
  href = "/ajuda"
}: EmergencyBarProps) {
  return (
    // BLOCO 2 - A barra e "fixed", ou seja, presa na parte de baixo da tela.
    // Ela nao sai da vista conforme a pessoa rola a pagina.
    // Isso e uma decisao de responsabilidade do projeto: alguem em risco
    // imediato precisa dos telefones agora, e nao de um formulario. O aviso
    // acompanha a pessoa por toda a navegacao publica.
    <aside
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ocean-600/20 bg-sand-100/95 px-4 py-3 backdrop-blur"
      role="note"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-ocean-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold leading-5">{text}</p>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-soft bg-ocean-800 px-4 font-bold text-white"
          href={href}
        >
          {actionLabel}
        </a>
      </div>
    </aside>
  );
}
