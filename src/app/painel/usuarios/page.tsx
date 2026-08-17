import { redirect } from "next/navigation";
import { UsuarioForm } from "@/components/painel/admin-forms";
import { NeuCard } from "@/components/ui";
import { formatDateTime } from "@/lib/denuncias";
import { isAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { getPainelSession } from "@/lib/server-auth";

export default async function UsuariosPage() {
  const session = await getPainelSession();

  if (!isAdmin(session?.user?.perfil)) {
    redirect("/painel?acesso=negado");
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      criadoEm: true
    }
  });

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Administração</p>
        <h1 className="mt-2 text-3xl font-bold">Usuários</h1>
        <p className="mt-3 text-text-secondary">
          Crie usuários da equipe, altere perfis e desative acessos sem apagar o histórico.
        </p>
      </section>

      <NeuCard title="Criar usuário" description="Somente administradores podem criar contas do painel.">
        <UsuarioForm />
      </NeuCard>

      <section className="grid gap-4">
        {usuarios.map((usuario) => (
          <NeuCard key={usuario.id} title={usuario.nome} description={usuario.email}>
            <div className="mb-5 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-aqua-300 px-3 py-1 text-ocean-900">
                {usuario.perfil === "ADMIN" ? "Administrador" : "Coordenador"}
              </span>
              <span className={`rounded-full px-3 py-1 ${usuario.ativo ? "bg-mint-200 text-ocean-900" : "bg-[#D8E4E6] text-ink-600"}`}>
                {usuario.ativo ? "Ativo" : "Inativo"}
              </span>
              <span className="rounded-full bg-base px-3 py-1 text-text-secondary shadow-neuro-inset">
                Criado em {formatDateTime(usuario.criadoEm)}
              </span>
            </div>
            <UsuarioForm usuario={usuario} />
          </NeuCard>
        ))}
      </section>
    </main>
  );
}
