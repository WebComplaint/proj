/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Tela do administrador para cadastrar o corpo docente: professores,
 * coordenadores e diretores.
 *
 * Repare que nao existe botao de EXCLUIR usuario, apenas o campo "ativo".
 * Isso e proposital: um usuario desativado perde o acesso, mas continua
 * aparecendo no historico dos casos que tratou. Apagar a pessoa apagaria
 * tambem a rastreabilidade de quem fez o que.
 *
 * Para a apresentacao: desativar em vez de excluir preserva o historico.
 */

import { redirect } from "next/navigation";
import { UsuarioForm } from "@/components/painel/admin-forms";
import { NeuCard } from "@/components/ui";
import { formatDateTime } from "@/lib/denuncias";
import { isAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { getPainelSession } from "@/lib/server-auth";

// BLOCO 1 - Traduz o codigo do cargo guardado no banco para o nome lido na
// tela: PROFESSOR vira "Professor", ADMIN vira "Administrador".
const perfilLabels = {
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenador",
  DIRETOR: "Diretor",
  ADMIN: "Administrador"
} as const;

export default async function UsuariosPage() {
  // BLOCO 2 - TERCEIRA CAMADA DE PROTECAO desta area.
  // A primeira e o porteiro (middleware.ts), a segunda e a rota da API, e esta
  // e a propria tela. Quem nao for administrador volta ao painel com um aviso.
  // Repetir a checagem parece exagero, mas e o que garante que a area continue
  // fechada mesmo se uma das outras camadas falhar um dia.
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
      emailVerificadoEm: true,
      criadoEm: true
    }
  });

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Administração</p>
        <h1 className="mt-2 text-3xl font-bold">Corpo docente</h1>
        <p className="mt-3 text-text-secondary">
          Cadastre professores, coordenadores e diretores, altere suas funções e desative acessos sem apagar o histórico.
        </p>
      </section>

      <NeuCard title="Criar usuário" description="Somente administradores podem criar contas do painel.">
        <UsuarioForm />
      </NeuCard>

      {/* BLOCO 3 - A LISTA DE USUARIOS.
          Cada pessoa aparece com um formulario de edicao ja aberto embaixo dos
          dados dela. Nao ha janela nem tela separada para editar: em uma
          equipe pequena, isso e mais rapido do que abrir e fechar janelas. */}
      <section className="grid gap-4">
        {usuarios.map((usuario) => (
          <NeuCard key={usuario.id} title={usuario.nome} description={usuario.email}>
            <div className="mb-5 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-aqua-300 px-3 py-1 text-ocean-900">
                {perfilLabels[usuario.perfil]}
              </span>
              <span className={`rounded-full px-3 py-1 ${usuario.ativo ? "bg-mint-200 text-ocean-900" : "bg-[#D8E4E6] text-ink-600"}`}>
                {usuario.ativo ? "Ativo" : "Inativo"}
              </span>
              {/* Conta nova ou com e-mail trocado so entra no painel depois de
                  confirmar o e-mail pelo link enviado. */}
              <span
                className={`rounded-full px-3 py-1 ${usuario.emailVerificadoEm ? "bg-mint-200 text-ocean-900" : "bg-sand-100 text-ink-600"}`}
              >
                {usuario.emailVerificadoEm ? "E-mail confirmado" : "E-mail pendente"}
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
