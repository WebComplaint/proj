type EmergencyBarProps = {
  text?: string;
  actionLabel?: string;
  href?: string;
};

export function EmergencyBar({
  text = "Esta plataforma não substitui atendimento de emergência. Em risco imediato: 190, Disque 100, Conselho Tutelar ou CVV 188.",
  actionLabel = "Ver ajuda",
  href = "/ajuda"
}: EmergencyBarProps) {
  return (
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
