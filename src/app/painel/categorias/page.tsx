import { redirect } from "next/navigation";
import { CategoriaForm } from "@/components/painel/admin-forms";
import { NeuCard, PrioridadeBadge } from "@/components/ui";
import { prioridadeUiMap } from "@/lib/denuncias";
import { isAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { getPainelSession } from "@/lib/server-auth";

export default async function CategoriasPage() {
  const session = await getPainelSession();

  if (!isAdmin(session?.user?.perfil)) {
    redirect("/painel?acesso=negado");
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: [{ ativa: "desc" }, { ordem: "asc" }, { nome: "asc" }]
  });

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Administração</p>
        <h1 className="mt-2 text-3xl font-bold">Categorias</h1>
        <p className="mt-3 text-text-secondary">
          Organize as categorias exibidas no formulário público e a prioridade inicial de cada uma.
        </p>
      </section>

      <NeuCard title="Criar categoria" description="Use slugs estáveis, porque eles são usados por filtros e integrações.">
        <CategoriaForm />
      </NeuCard>

      <section className="grid gap-4">
        {categorias.map((categoria) => (
          <NeuCard key={categoria.id} title={categoria.nome} description={categoria.slug}>
            <div className="mb-5 flex flex-wrap gap-3 text-sm font-bold">
              <PrioridadeBadge prioridade={prioridadeUiMap[categoria.prioridadePadrao]} />
              <span className={`rounded-full px-3 py-1 ${categoria.ativa ? "bg-mint-200 text-ocean-900" : "bg-[#D8E4E6] text-ink-600"}`}>
                {categoria.ativa ? "Ativa" : "Inativa"}
              </span>
              <span className="rounded-full bg-base px-3 py-1 text-text-secondary shadow-neuro-inset">
                Ordem {categoria.ordem}
              </span>
            </div>
            <CategoriaForm categoria={categoria} />
          </NeuCard>
        ))}
      </section>
    </main>
  );
}
