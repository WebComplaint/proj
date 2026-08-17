import Link from "next/link";
import { NeuCard } from "@/components/ui";

const steps = [
  {
    title: "Você registra o relato",
    text: "O formulário guia uma etapa por vez, com perguntas curtas e espaço para contar apenas o que você souber."
  },
  {
    title: "O sistema gera um protocolo",
    text: "Guarde esse código. Ele permite acompanhar respostas públicas sem precisar criar conta."
  },
  {
    title: "A equipe acompanha o caso",
    text: "Pessoas autorizadas analisam a denúncia, registram histórico e definem encaminhamentos internos."
  }
];

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Passo a passo</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Como funciona
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          A denúncia entra por um canal simples, recebe protocolo e segue para análise da escola em uma área restrita.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <NeuCard key={step.title} as="article">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-800 font-bold text-white">
              {index + 1}
            </span>
            <h2 className="mt-4 text-xl font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{step.text}</p>
          </NeuCard>
        ))}
      </section>

      <NeuCard title="O que aparece para quem acompanha" description="A consulta por protocolo mostra somente informações públicas do caso.">
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Notas internas ficam visíveis apenas para a equipe autorizada.
          </p>
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Mudanças de status usam rótulo em texto, não apenas cor.
          </p>
        </div>
      </NeuCard>

      <div className="grid gap-3 sm:flex">
        <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
          Fazer denúncia
        </Link>
        <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/privacidade">
          Ver privacidade
        </Link>
      </div>
    </main>
  );
}
