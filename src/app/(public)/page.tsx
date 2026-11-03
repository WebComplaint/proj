/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a PAGINA INICIAL, a primeira tela que a pessoa ve.
 *
 * Tem tres partes: os dois botoes principais (Fazer denuncia e Acompanhar
 * denuncia), a explicacao do processo em 3 passos e os cartoes sobre
 * sigilo. Todo o texto foi escrito para tranquilizar quem chega com medo.
 *
 * Para a apresentacao: comece a demonstracao por esta tela.
 */

import Link from "next/link";
import { NeuCard } from "@/components/ui";

// BLOCO 1 - Os textos dos 3 passos, escritos fora da tela.
// Separar o texto do desenho tem uma vantagem pratica: para mudar uma frase,
// a escola mexe so aqui, sem tocar na parte visual.
const steps = [
  {
    title: "Conte o que aconteceu",
    text: "Escolha a categoria e escreva o relato no seu ritmo. Você pode enviar como anônimo."
  },
  {
    title: "Receba um protocolo",
    text: "Ao finalizar, o sistema mostra um código para acompanhar o andamento depois."
  },
  {
    title: "A equipe analisa",
    text: "A escola vê o caso no painel restrito e registra os próximos encaminhamentos."
  }
];

// BLOCO 2 - Os textos sobre sigilo. Eles aparecem logo na primeira tela de
// proposito: quem pensa em denunciar precisa saber que estara protegido antes
// de decidir escrever qualquer coisa.
const privacyCards = [
  {
    title: "Anonimato",
    text: "Na denúncia anônima, nome e e-mail não são pedidos. O telefone fica restrito à administração da escola."
  },
  {
    title: "Criptografia",
    text: "As informações devem trafegar por conexão segura e ficam protegidas na infraestrutura da escola."
  },
  {
    title: "Acesso restrito",
    text: "Somente pessoas autorizadas da equipe escolar acessam e tratam os casos."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:gap-16 lg:py-16">
      <section className="surface-neuro grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-10">
        <div>
          <p className="text-sm font-bold text-text-secondary">Canal seguro da escola</p>
          <h1 className="mt-3 max-w-3xl text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
            Denúncia escolar
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
            Registre uma situação de bullying, assédio, abuso ou discriminação com uma experiência curta, acolhedora e sem burocracia.
          </p>
          {/* OS DOIS BOTOES PRINCIPAIS do sistema inteiro.
              Sao apenas dois, e nao um menu cheio de opcoes: quem chega aqui
              quer fazer uma denuncia ou acompanhar uma que ja fez. */}
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 text-base sm:w-auto" href="/denunciar">
              Fazer denúncia
            </Link>
            <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 text-base sm:w-auto" href="/acompanhar">
              Acompanhar denúncia
            </Link>
          </div>
        </div>
        <div className="rounded-cloud bg-base p-5 shadow-neuro-inset">
          <div className="rounded-calm bg-aqua-300 p-5 text-ocean-900">
            <p className="text-sm font-bold">Você escolhe como se identificar</p>
            <p className="mt-3 font-heading text-3xl font-bold">Anônima ou identificada</p>
            <p className="mt-3 text-sm leading-6">
              O formulário mostra apenas os campos necessários para a opção escolhida.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">Como funciona</h2>
          <p className="mt-3 leading-7 text-text-secondary">
            Três passos simples para registrar o relato e acompanhar o caso sem precisar repetir tudo de novo.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* O ".map" percorre a lista do bloco 1 e desenha um cartao para
              cada item. Acrescentando um quarto passo la em cima, ele aparece
              aqui sozinho, sem mexer nesta parte. */}
          {steps.map((step, index) => (
            <NeuCard key={step.title} as="article" className="grid gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-800 font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{step.text}</p>
              </div>
            </NeuCard>
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">Seu sigilo é garantido</h2>
          <p className="mt-3 leading-7 text-text-secondary">
            A plataforma foi pensada para reduzir exposição e limitar acesso às informações.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {privacyCards.map((card) => (
            <NeuCard key={card.title} as="article" title={card.title}>
              <p className="text-sm leading-6 text-text-secondary">{card.text}</p>
            </NeuCard>
          ))}
        </div>
      </section>
    </main>
  );
}
