/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Lista os canais oficiais de socorro: 190, Disque 100, Conselho Tutelar e
 * CVV 188.
 *
 * Esta pagina existe por responsabilidade. O sistema registra e acompanha
 * casos, mas nao atende emergencia. Deixar isso claro evita que alguem em
 * risco imediato fique so esperando uma resposta pelo site.
 *
 * Para a apresentacao: e o limite etico do projeto, vale citar.
 */

import Link from "next/link";
import { NeuCard } from "@/components/ui";

// BLOCO UNICO - Os canais oficiais de socorro, com o numero, o orgao e quando
// acionar cada um. Sao canais publicos brasileiros, e nao telefones da escola:
// eles funcionam 24 horas e independem do horario escolar.
const channels = [
  {
    name: "190",
    label: "Polícia Militar",
    text: "Use em situação de emergência ou risco imediato."
  },
  {
    name: "Disque 100",
    label: "Direitos Humanos",
    text: "Canal oficial para violações de direitos humanos."
  },
  {
    name: "Conselho Tutelar",
    label: "Município",
    text: "Procure o Conselho Tutelar da sua cidade para proteção de crianças e adolescentes."
  },
  {
    name: "CVV 188",
    label: "Apoio emocional",
    text: "Atendimento 24h para conversar em momentos difíceis."
  }
];

export default function AjudaPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Canais de apoio</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Ajuda em situação urgente
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          A denúncia escolar ajuda a registrar e acompanhar o caso, mas não substitui atendimento de emergência.
        </p>
      </section>

      {/* Os quatro canais em cartoes grandes, com o numero em destaque.
          O numero vem primeiro, e nao o nome do orgao: quem esta em risco
          precisa achar o telefone rapido, sem ler o cartao inteiro. */}
      <section className="grid gap-4 sm:grid-cols-2">
        {channels.map((channel) => (
          <NeuCard key={channel.name} as="article">
            <p className="protocol text-2xl font-bold text-ocean-900">{channel.name}</p>
            <h2 className="mt-3 text-xl font-bold">{channel.label}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{channel.text}</p>
          </NeuCard>
        ))}
      </section>

      <NeuCard title="Quando falar com alguém agora" variant="pressed">
        <p className="text-sm leading-6 text-text-secondary">
          Se houver violência em curso, ameaça imediata, medo de voltar para casa ou risco de autolesão, procure um adulto de confiança e acione um canal oficial de emergência.
        </p>
      </NeuCard>

      <div className="grid gap-3 sm:flex">
        <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
          Fazer denúncia
        </Link>
        <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
