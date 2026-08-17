import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { NeuCard, StatCard } from "@/components/ui";
import { isAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { getPainelSession } from "@/lib/server-auth";

type RelatoriosPageProps = {
  searchParams?: {
    inicio?: string;
    fim?: string;
  };
};

export default async function RelatoriosPage({ searchParams = {} }: RelatoriosPageProps) {
  const session = await getPainelSession();

  if (!isAdmin(session?.user?.perfil)) {
    redirect("/painel?acesso=negado");
  }

  const where: Prisma.DenunciaWhereInput =
    searchParams.inicio || searchParams.fim
      ? {
          criadoEm: {
            gte: searchParams.inicio ? new Date(searchParams.inicio) : undefined,
            lte: searchParams.fim ? new Date(`${searchParams.fim}T23:59:59.999`) : undefined
          }
        }
      : {};
  const [total, anonimas, identificadas, urgentes, porStatus] = await Promise.all([
    prisma.denuncia.count({ where }),
    prisma.denuncia.count({ where: { ...where, anonima: true } }),
    prisma.denuncia.count({ where: { ...where, anonima: false } }),
    prisma.denuncia.count({ where: { ...where, prioridade: "URGENTE" } }),
    prisma.denuncia.groupBy({
      by: ["status"],
      where,
      _count: { _all: true }
    })
  ]);
  const exportParams = new URLSearchParams();

  if (searchParams.inicio) {
    exportParams.set("inicio", searchParams.inicio);
  }

  if (searchParams.fim) {
    exportParams.set("fim", searchParams.fim);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Administração</p>
        <h1 className="mt-2 text-3xl font-bold">Relatórios</h1>
        <p className="mt-3 text-text-secondary">
          Consulte um resumo do período e exporte as denúncias em CSV.
        </p>
      </section>

      <NeuCard title="Período do relatório">
        <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-bold text-text-secondary">
            Início
            <input className="field-inset px-4" name="inicio" type="date" defaultValue={searchParams.inicio} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-secondary">
            Fim
            <input className="field-inset px-4" name="fim" type="date" defaultValue={searchParams.fim} />
          </label>
          <button className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-3" type="submit">
            Aplicar período
          </button>
          <a className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href={`/api/painel/relatorios/export?${exportParams.toString()}`}>
            Exportar CSV
          </a>
        </form>
      </NeuCard>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={String(total)} variation="Denúncias no período" />
        <StatCard label="Anônimas" value={String(anonimas)} variation="Sem dados pessoais" />
        <StatCard label="Identificadas" value={String(identificadas)} variation="Com contato informado" />
        <StatCard label="Urgentes" value={String(urgentes)} variation="Prioridade urgente" />
      </section>

      <NeuCard title="Distribuição por status">
        {porStatus.length > 0 ? (
          <div className="grid gap-3">
            {porStatus.map((item) => (
              <div key={item.status} className="flex min-h-11 items-center justify-between rounded-soft bg-base px-4 shadow-neuro-inset">
                <span className="text-sm font-bold text-text-primary">{item.status}</span>
                <span className="text-sm font-bold text-text-secondary">{item._count._all}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Não há denúncias no período selecionado. Ajuste as datas para ampliar o relatório.
          </p>
        )}
      </NeuCard>
    </main>
  );
}
