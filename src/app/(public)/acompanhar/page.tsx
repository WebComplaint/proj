/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a tela onde a pessoa digita o protocolo para acompanhar a denuncia.
 *
 * Nao pede login nem cadastro: o codigo do protocolo e a unica coisa
 * necessaria. Isso e o que permite acompanhar um caso anonimo.
 *
 * Para a apresentacao: acompanhar nao exige conta nem senha.
 */

import { ConsultaProtocoloForm } from "@/components/publico/consulta-protocolo-form";
import { NeuCard } from "@/components/ui";

export default function AcompanharPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {/* BLOCO 1 - O cabecalho, que pede o codigo exatamente como ele apareceu
          na confirmacao do envio. Nao ha login nem cadastro nesta tela: o
          protocolo e a unica coisa necessaria, e e isso que torna possivel
          acompanhar uma denuncia anonima. */}
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Consulta pública</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Acompanhar denúncia
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          Digite o protocolo exatamente como ele apareceu na confirmação do envio.
        </p>
      </section>

      {/* BLOCO 2 - O campo de digitar o protocolo.
          A descricao do cartao ja avisa que a consulta mostra apenas
          informacoes publicas, para ninguem esperar ver o relato completo. */}
      <NeuCard title="Informe o protocolo" description="A consulta mostra apenas informações públicas do acompanhamento.">
        <ConsultaProtocoloForm />
      </NeuCard>
    </main>
  );
}
