import Link from "next/link";
import { CategoryBarChart, MonthlyLineChart } from "@/components/painel/dashboard-charts";
import { NeuCard, PrioridadeBadge, StatCard, StatusBadge } from "@/components/ui";
import { formatDateTime, prioridadeUiMap, statusUiMap } from "@/lib/denuncias";
import { getDashboardData } from "@/lib/dashboard";

type PainelPageProps = {
  searchParams?: {
    acesso?: string;
  };
};

export default async function PainelPage({ searchParams }: PainelPageProps) {
  const acessoNegado = searchParams?.acesso === "negado";
  const dashboard = await getDashboardData();
  const hasSlaAlert = dashboard.foraSla.length > 0;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      {acessoNegado && (
        <div className="rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          Você não tem permissão para acessar essa área. Continue pelo painel disponível ao seu perfil.
        </div>
      )}

      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Visão geral</p>
        <h1 className="mt-2 text-3xl font-bold">Painel</h1>
        <p className="mt-3 max-w-2xl leading-7 text-text-secondary">
          Acompanhe triagem, andamento e resoluções sem perder casos que precisam de atenção.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicadores do painel">
        <StatCard
          label="Total do mês"
          value={String(dashboard.indicadores.totalMes)}
          variation="Denúncias abertas neste mês"
          icon="M"
        />
        <StatCard
          label="Aguardando triagem"
          value={String(dashboard.indicadores.aguardandoTriagem)}
          variation="Casos ainda recebidos"
          icon="T"
        />
        <StatCard
          label="Em andamento"
          value={String(dashboard.indicadores.emAndamento)}
          variation="Casos em tratamento"
          icon="A"
        />
        <StatCard
          label="Resolvidas"
          value={String(dashboard.indicadores.resolvidas)}
          variation="Casos finalizados"
          icon="R"
        />
      </section>

      {hasSlaAlert ? (
        <NeuCard
          className="border border-danger-600/30 bg-danger-100"
          title="Casos fora do SLA de triagem"
          description="Denúncias paradas em recebida por mais de 48 horas precisam de atenção."
          variant="flat"
        >
          <div className="grid gap-3">
            {dashboard.foraSla.slice(0, 5).map((denuncia) => (
              <Link
                key={denuncia.id}
                className="grid gap-2 rounded-soft bg-base p-4 text-text-primary shadow-neuro-sm sm:grid-cols-[1fr_auto] sm:items-center"
                href={`/painel/denuncias/${denuncia.id}`}
              >
                <div>
                  <p className="protocol text-sm font-bold">{denuncia.protocolo}</p>
                  <p className="mt-1 text-sm text-text-secondary">{denuncia.categoria.nome}</p>
                </div>
                <span className="rounded-full bg-danger-100 px-3 py-1 text-sm font-bold text-danger-600">
                  Aberta em {formatDateTime(denuncia.criadoEm)}
                </span>
              </Link>
            ))}
          </div>
          {dashboard.foraSla.length > 5 && (
            <Link className="btn-secondary mt-4 inline-flex min-h-11 items-center justify-center px-5 py-3" href="/painel/denuncias?status=RECEBIDA">
              Ver todos os atrasados
            </Link>
          )}
        </NeuCard>
      ) : (
        <NeuCard title="SLA de triagem em dia" description="Nenhuma denúncia recebida está parada há mais de 48 horas.">
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Continue acompanhando novos registros para manter a triagem no prazo.
          </p>
        </NeuCard>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <NeuCard title="Denúncias por categoria" description="Distribuição dos casos registrados.">
          <CategoryBarChart data={dashboard.porCategoria} />
        </NeuCard>
        <NeuCard title="Denúncias por mês" description="Volume registrado nos últimos 6 meses.">
          <MonthlyLineChart data={dashboard.porMes} />
        </NeuCard>
      </section>

      <NeuCard
        title="Denúncias recentes"
        description="Os 5 registros mais novos aparecem aqui para triagem rápida."
        action={
          <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-4 py-3" href="/painel/denuncias">
            Ver todas
          </Link>
        }
      >
        {dashboard.recentes.length > 0 ? (
          <div className="grid gap-3">
            {dashboard.recentes.map((denuncia) => (
              <Link
                key={denuncia.id}
                className="surface-neuro-sm grid gap-4 p-4 text-text-primary transition-transform duration-200 ease-calm hover:-translate-y-0.5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center"
                href={`/painel/denuncias/${denuncia.id}`}
              >
                <div>
                  <p className="protocol text-sm font-bold">{denuncia.protocolo}</p>
                  <p className="mt-1 text-sm text-text-secondary">{denuncia.anonima ? "Anônima" : "Identificada"}</p>
                </div>
                <p className="text-sm font-bold">{denuncia.categoria.nome}</p>
                <StatusBadge status={statusUiMap[denuncia.status]} />
                <PrioridadeBadge prioridade={prioridadeUiMap[denuncia.prioridade]} />
                <div>
                  <p className="text-sm text-text-secondary">{formatDateTime(denuncia.criadoEm)}</p>
                  <p className="mt-1 text-sm text-text-secondary">{denuncia.responsavel?.nome ?? "Sem responsável"}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
            Quando novas denúncias forem registradas, as mais recentes aparecerão aqui para acompanhamento.
          </p>
        )}
      </NeuCard>
    </main>
  );
}
