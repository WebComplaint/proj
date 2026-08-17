import { ConfirmacaoDenuncia } from "@/components/publico/confirmacao-denuncia";

export default function DenunciaEnviadaPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Denúncia enviada</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Seu relato foi registrado
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          A equipe da escola poderá analisar o caso e registrar encaminhamentos.
        </p>
      </section>
      <ConfirmacaoDenuncia />
    </main>
  );
}
