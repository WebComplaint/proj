/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a LISTA de denuncias, com filtros e paginacao.
 *
 * A equipe pode filtrar por protocolo, status, categoria, prioridade, tipo
 * (anonima ou identificada), responsavel e periodo de datas. Os filtros
 * escolhidos ficam gravados no proprio endereco da pagina, entao o link
 * pode ser copiado e enviado para um colega ja filtrado.
 *
 * A lista mostra 20 casos por vez. Cada caso parado ha mais de 48 horas
 * ganha a etiqueta vermelha "Triagem atrasada".
 *
 * Para a apresentacao: e a tela de trabalho do dia a dia da equipe.
 */

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { EmptyState, NeuCard, PrioridadeBadge, StatusBadge } from "@/components/ui";
import { hojeEmBrasilia } from "@/lib/date-utils";
import { formatDateTime, isTriagemAtrasada, prioridadeOptions, prioridadeUiMap, statusOptions, statusUiMap } from "@/lib/denuncias";
import { prisma } from "@/lib/prisma";
import { painelDenunciasQuerySchema } from "@/lib/validacoes";

const PAGE_SIZE = 20;

type PainelDenunciasPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PainelDenunciasPage({ searchParams = {} }: PainelDenunciasPageProps) {
  // BLOCO 1 - Le e confere os filtros que estao no endereco da pagina.
  // Guardar os filtros na URL, e nao na memoria da tela, tem uma vantagem
  // pratica: a equipe copia o link ja filtrado e envia para um colega.
  // Um endereco editado a mao (status=xyz, uma data invalida) nao derruba a
  // pagina: os filtros sao descartados e a lista abre sem filtro nenhum.
  const parsed = painelDenunciasQuerySchema.safeParse(flattenSearchParams(searchParams));
  const query = parsed.success ? parsed.data : painelDenunciasQuerySchema.parse({});
  const hoje = hojeEmBrasilia();

  // BLOCO 2 - Monta o filtro de busca. Cada "undefined" significa "nao filtre
  // por este campo", ou seja, os filtros deixados em branco sao ignorados.
  const where: Prisma.DenunciaWhereInput = {
    status: query.status,
    prioridade: query.prioridade,
    categoria: query.categoria ? { slug: query.categoria } : undefined,
    responsavelId: query.responsavelId || undefined,
    protocolo: query.protocolo ? { contains: query.protocolo } : undefined,
    anonima: query.tipo === "anonima" ? true : query.tipo === "identificada" ? false : undefined,
    criadoEm:
      query.inicio || query.fim
        ? {
            gte: query.inicio ? new Date(query.inicio) : undefined,
            lte: query.fim ? new Date(`${query.fim}T23:59:59.999`) : undefined
          }
        : undefined
  };
  // Quantos registros pular para chegar na pagina pedida.
  const skip = (query.pagina - 1) * PAGE_SIZE;

  // BLOCO 3 - Faz as quatro consultas ao mesmo tempo:
  //   1. o total de casos que combinam com os filtros;
  //   2. os 20 casos desta pagina;
  //   3. as categorias ativas, para preencher o filtro de categoria;
  //   4. os usuarios ativos, para preencher o filtro de responsavel.
  // As duas ultimas alimentam as listas suspensas do formulario de filtros.
  const [total, denuncias, categorias, usuarios] = await Promise.all([
    prisma.denuncia.count({ where }),
    prisma.denuncia.findMany({
      where,
      orderBy:
        query.ordenarPor === "prioridade"
          ? [{ prioridade: query.direcao }, { criadoEm: "desc" }]
          : [{ criadoEm: query.direcao }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        protocolo: true,
        status: true,
        prioridade: true,
        anonima: true,
        criadoEm: true,
        categoria: { select: { nome: true, slug: true } },
        responsavel: { select: { nome: true } }
      }
    }),
    prisma.categoria.findMany({ where: { ativa: true }, orderBy: { ordem: "asc" } }),
    prisma.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } })
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Painel</p>
        <h1 className="mt-2 text-3xl font-bold">Denúncias</h1>
        <p className="mt-3 text-text-secondary">
          Filtre, priorize e acompanhe os casos registrados pela plataforma.
        </p>
      </section>

      <NeuCard title="Filtros" description="Use um ou mais campos para encontrar denúncias específicas.">
        {/* BLOCO 4 - O FORMULARIO DE FILTROS.
            Note que ele nao tem "action" nem codigo de envio: e um formulario
            comum do navegador. Ao clicar em "Aplicar filtros", os campos viram
            parametros no endereco e a pagina recarrega ja filtrada.
            Simples, funciona sem JavaScript e deixa o link compartilhavel. */}
        <form className="grid gap-4 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold text-text-secondary">
            Protocolo
            <input className="field-inset px-4" name="protocolo" defaultValue={query.protocolo} placeholder="DEN-2026..." />
          </label>
          <SelectFilter label="Status" name="status" value={query.status} options={statusOptions} />
          <SelectFilter label="Categoria" name="categoria" value={query.categoria} options={categorias.map((categoria) => ({ value: categoria.slug, label: categoria.nome }))} />
          <SelectFilter label="Prioridade" name="prioridade" value={query.prioridade} options={prioridadeOptions} />
          <SelectFilter label="Tipo" name="tipo" value={query.tipo} options={[{ value: "anonima", label: "Anônima" }, { value: "identificada", label: "Identificada" }]} />
          <SelectFilter label="Responsável" name="responsavelId" value={query.responsavelId} options={usuarios.map((usuario) => ({ value: usuario.id, label: usuario.nome }))} />
          <label className="grid gap-2 text-sm font-bold text-text-secondary">
            Início
            <input className="field-inset px-4" name="inicio" type="date" max={query.fim ?? hoje} defaultValue={query.inicio} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-secondary">
            Fim
            <input className="field-inset px-4" name="fim" type="date" min={query.inicio} max={hoje} defaultValue={query.fim} />
          </label>
          <SelectFilter label="Ordenar por" name="ordenarPor" value={query.ordenarPor} options={[{ value: "data", label: "Data" }, { value: "prioridade", label: "Prioridade" }]} />
          <SelectFilter label="Direção" name="direcao" value={query.direcao} options={[{ value: "desc", label: "Mais recentes primeiro" }, { value: "asc", label: "Mais antigos primeiro" }]} />
          <div className="grid gap-3 sm:flex lg:col-span-2 lg:items-end">
            <button className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-3" type="submit">
              Aplicar filtros
            </button>
            <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/painel/denuncias">
              Limpar filtros
            </Link>
          </div>
        </form>
      </NeuCard>

      {denuncias.length === 0 ? (
        <EmptyState
          title="Nenhuma denúncia encontrada"
          text="Ajuste os filtros, limpe a busca ou aguarde novos registros chegarem pelo formulário público."
          action={
            <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-4" href="/painel/denuncias">
              Limpar filtros
            </Link>
          }
        />
      ) : (
        <section className="grid gap-3">
          {denuncias.map((denuncia) => {
            // Para cada caso da lista, verifica se ele passou do prazo de
            // 48 horas em triagem. Se sim, ganha a etiqueta vermelha abaixo.
            const atrasada = isTriagemAtrasada(denuncia.status, denuncia.criadoEm);

            return (
              <Link
                key={denuncia.id}
                className="surface-neuro-sm grid gap-4 p-4 text-text-primary transition-transform duration-200 ease-calm hover:-translate-y-0.5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] lg:items-center"
                href={`/painel/denuncias/${denuncia.id}`}
              >
                <div>
                  <p className="protocol text-sm font-bold">{denuncia.protocolo}</p>
                  <p className="mt-1 text-sm text-text-secondary">{denuncia.anonima ? "Anônima" : "Identificada"}</p>
                </div>
                <p className="text-sm font-bold">{denuncia.categoria.nome}</p>
                <StatusBadge status={statusUiMap[denuncia.status]} />
                <PrioridadeBadge prioridade={prioridadeUiMap[denuncia.prioridade]} />
                <p className="text-sm text-text-secondary">{denuncia.responsavel?.nome ?? "Sem responsável"}</p>
                <div className="grid gap-2">
                  <p className="text-sm text-text-secondary">{formatDateTime(denuncia.criadoEm)}</p>
                  {atrasada && (
                    <span className="rounded-full bg-danger-100 px-3 py-1 text-xs font-bold text-danger-600">
                      Triagem atrasada
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginação">
        <p className="text-sm text-text-secondary">
          Página {query.pagina} de {totalPaginas}. {total} resultado(s).
        </p>
        <div className="grid gap-3 sm:flex">
          <PaginationLink disabled={query.pagina <= 1} label="Página anterior" page={query.pagina - 1} searchParams={query} />
          <PaginationLink disabled={query.pagina >= totalPaginas} label="Próxima página" page={query.pagina + 1} searchParams={query} />
        </div>
      </nav>
    </main>
  );
}

// BLOCO 5 - Um molde de lista suspensa reaproveitado por todos os filtros.
// Cada um comeca com a opcao "Todos", que significa "nao filtrar por isso".
function SelectFilter({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text-secondary">
      {label}
      <select className="field-inset px-4" name={name} defaultValue={value ?? ""}>
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// BLOCO 6 - O botao de pagina anterior e proxima.
// Ele reconstroi o endereco mantendo TODOS os filtros ativos e trocando so o
// numero da pagina. Sem esse cuidado, ir para a pagina 2 perderia os filtros
// e a equipe voltaria para a lista completa.
// Na primeira ou na ultima pagina, o botao vira texto cinza sem link.
function PaginationLink({
  disabled,
  label,
  page,
  searchParams
}: {
  disabled: boolean;
  label: string;
  page: number;
  searchParams: Record<string, string | number | undefined>;
}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  params.set("pagina", String(page));

  if (disabled) {
    return (
      <span className="inline-flex min-h-11 items-center justify-center rounded-soft bg-base px-5 py-3 text-sm font-bold text-ink-400 shadow-neuro-inset">
        {label}
      </span>
    );
  }

  return (
    <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href={`/painel/denuncias?${params.toString()}`}>
      {label}
    </Link>
  );
}

// BLOCO 7 - Ajuste tecnico dos filtros do endereco.
// Um mesmo filtro pode aparecer repetido na URL, e nesse caso o Next.js
// entrega uma lista. Aqui o sistema fica com o primeiro valor, para que a
// conferencia dos filtros receba sempre um texto simples.
function flattenSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
}
