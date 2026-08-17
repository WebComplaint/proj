import Link from "next/link";
import { NeuCard } from "@/components/ui";

const topics = [
  {
    title: "Denúncia anônima",
    text: "Se você escolher anonimato, o sistema não pede nome, e-mail ou telefone. Esses campos nem aparecem no formulário."
  },
  {
    title: "Denúncia identificada",
    text: "Se você decidir se identificar, seus dados são usados para contato sobre o caso e ficam restritos à equipe autorizada."
  },
  {
    title: "Histórico do caso",
    text: "Alterações de status e respostas públicas ficam registradas para dar previsibilidade ao acompanhamento."
  },
  {
    title: "Acesso da equipe",
    text: "As rotas do painel exigem login. Usuários inativos não acessam o sistema, mas permanecem no histórico do que trataram."
  }
];

export default function PrivacidadePage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Privacidade e LGPD</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Seu relato precisa de cuidado
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          A plataforma coleta o mínimo necessário para registrar, acompanhar e tratar denúncias escolares.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <NeuCard key={topic.title} as="article" title={topic.title}>
            <p className="text-sm leading-6 text-text-secondary">{topic.text}</p>
          </NeuCard>
        ))}
      </section>

      <NeuCard title="Importante" variant="pressed">
        <p className="text-sm leading-6 text-text-secondary">
          A política completa deve ser revisada pela instituição antes da publicação. Esta tela deixa claro o comportamento previsto no sistema e evita promessas que dependem de processos externos.
        </p>
      </NeuCard>

      <div className="grid gap-3 sm:flex">
        <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
          Fazer denúncia
        </Link>
        <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/como-funciona">
          Como funciona
        </Link>
      </div>
    </main>
  );
}
