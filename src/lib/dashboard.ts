import { subMonths, startOfMonthKey, toMonthKey } from "@/lib/date-utils";
import { isTriagemAtrasada } from "@/lib/denuncias";
import { prisma } from "@/lib/prisma";

export async function getDashboardData(now = new Date()) {
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthKeys = Array.from({ length: 6 }, (_, index) => startOfMonthKey(subMonths(now, 5 - index)));

  const [
    totalMes,
    aguardandoTriagem,
    emAndamento,
    resolvidas,
    recebidas,
    porCategoria,
    denunciasPeriodo,
    recentes
  ] = await Promise.all([
    prisma.denuncia.count({
      where: {
        criadoEm: {
          gte: currentMonthStart
        }
      }
    }),
    prisma.denuncia.count({
      where: {
        status: "RECEBIDA"
      }
    }),
    prisma.denuncia.count({
      where: {
        status: "EM_ANDAMENTO"
      }
    }),
    prisma.denuncia.count({
      where: {
        status: "RESOLVIDA"
      }
    }),
    prisma.denuncia.findMany({
      where: {
        status: "RECEBIDA"
      },
      select: {
        id: true,
        protocolo: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        criadoEm: "asc"
      }
    }),
    prisma.denuncia.groupBy({
      by: ["categoriaId"],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          categoriaId: "desc"
        }
      }
    }),
    prisma.denuncia.findMany({
      where: {
        criadoEm: {
          gte: sixMonthsStart
        }
      },
      select: {
        criadoEm: true
      }
    }),
    prisma.denuncia.findMany({
      take: 5,
      orderBy: {
        criadoEm: "desc"
      },
      select: {
        id: true,
        protocolo: true,
        status: true,
        prioridade: true,
        anonima: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true
          }
        },
        responsavel: {
          select: {
            nome: true
          }
        }
      }
    })
  ]);

  const categorias = await prisma.categoria.findMany({
    where: {
      id: {
        in: porCategoria.map((item) => item.categoriaId)
      }
    },
    select: {
      id: true,
      nome: true
    }
  });
  const categoriaNomePorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));
  const mensalMap = new Map(monthKeys.map((key) => [key, 0]));

  for (const denuncia of denunciasPeriodo) {
    const key = toMonthKey(denuncia.criadoEm);
    mensalMap.set(key, (mensalMap.get(key) ?? 0) + 1);
  }

  const foraSla = recebidas.filter((denuncia) => isTriagemAtrasada("RECEBIDA", denuncia.criadoEm, now));

  return {
    indicadores: {
      totalMes,
      aguardandoTriagem,
      emAndamento,
      resolvidas
    },
    foraSla,
    porCategoria: porCategoria.map((item) => ({
      categoria: categoriaNomePorId.get(item.categoriaId) ?? "Categoria removida",
      total: item._count._all
    })),
    porMes: monthKeys.map((key) => ({
      mes: formatMonthLabel(key),
      total: mensalMap.get(key) ?? 0
    })),
    recentes
  };
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit"
  }).format(new Date(year, month - 1, 1));
}
