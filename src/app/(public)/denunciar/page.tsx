/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a pagina que apresenta o formulario de denuncia.
 *
 * Ela mesma so desenha o titulo e a explicacao. Todo o trabalho pesado do
 * formulario em 3 etapas fica no componente DenunciaForm, para que esta
 * pagina continue simples de ler.
 *
 * Para a apresentacao: e a porta de entrada do relato.
 */

import { DenunciaForm } from "@/components/publico/denuncia-form";

export default function DenunciarPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      {/* BLOCO 1 - O cabecalho da tela.
          O texto ja avisa, antes de qualquer campo, que so categoria e
          descricao sao obrigatorias. Saber que o resto e opcional reduz a
          desistencia de quem tem medo de nao lembrar de todos os detalhes. */}
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Registro em etapas</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Fazer denúncia
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          Você pode enviar de forma anônima ou identificada. Categoria e descrição são obrigatórias; o resto é opcional.
        </p>
      </section>
      {/* BLOCO 2 - O formulario em 3 etapas.
          Toda a logica de preenchimento, validacao e envio fica no componente
          DenunciaForm, e nao aqui. Assim esta pagina continua curta e facil de
          ler, e o formulario poderia ser reaproveitado em outra tela. */}
      <DenunciaForm />
    </main>
  );
}
