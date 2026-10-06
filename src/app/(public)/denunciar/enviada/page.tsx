/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a tela de confirmacao, exibida logo depois que a denuncia e enviada.
 * E aqui que o protocolo aparece para a pessoa guardar.
 *
 * Para a apresentacao: mostre que o protocolo so aparece uma unica vez.
 */

import { ConfirmacaoDenuncia } from "@/components/publico/confirmacao-denuncia";

export default function DenunciaEnviadaPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {/* BLOCO 1 - A confirmacao de que o relato foi registrado.
          O texto diz que a equipe "podera analisar" o caso, e nao que vai
          resolver. E uma escolha de honestidade: o sistema nao promete um
          resultado que depende de decisao humana. */}
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Denúncia enviada</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Seu relato foi registrado
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          A equipe da escola poderá analisar o caso e registrar encaminhamentos.
        </p>
      </section>
      {/* BLOCO 2 - O componente que exibe o protocolo.
          Ele le o codigo da memoria temporaria da aba e o apaga em seguida,
          para que nao reapareca se a pagina for atualizada. */}
      <ConfirmacaoDenuncia />
    </main>
  );
}
