import { cn } from "@/lib/cn";

type CategoryDatum = {
  categoria: string;
  total: number;
};

type MonthDatum = {
  mes: string;
  total: number;
};

export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  const max = Math.max(1, ...data.map((item) => item.total));

  if (data.length === 0) {
    return (
      <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
        Ainda não há denúncias categorizadas para exibir no gráfico.
      </p>
    );
  }

  return (
    <div className="grid gap-4" role="img" aria-label="Gráfico de barras de denúncias por categoria">
      {data.map((item) => (
        <div key={item.categoria} className="grid gap-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-bold text-text-primary">{item.categoria}</span>
            <span className="font-semibold text-text-secondary">{item.total}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-base shadow-neuro-inset">
            <div
              className="h-full rounded-full bg-aqua-300"
              style={{ width: `${Math.max(8, (item.total / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthlyLineChart({ data }: { data: MonthDatum[] }) {
  const max = Math.max(1, ...data.map((item) => item.total));
  const width = 360;
  const height = 180;
  const padding = 24;
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - (item.total / max) * (height - padding * 2);

    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="grid gap-4" role="img" aria-label="Gráfico de linha de denúncias por mês">
      <svg className="h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="rgb(var(--ocean-600) / 0.25)" />
        <path d={path} fill="none" stroke="rgb(var(--ocean-800))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point) => (
          <g key={point.mes}>
            <circle cx={point.x} cy={point.y} fill="rgb(var(--sand-300))" r="5" stroke="rgb(var(--ocean-800))" strokeWidth="3" />
            <text fill="rgb(var(--text-secondary))" fontSize="10" textAnchor="middle" x={point.x} y={height - 4}>
              {point.mes}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <span
            key={item.mes}
            className={cn(
              "rounded-soft bg-base px-3 py-2 text-sm font-semibold text-text-secondary shadow-neuro-inset",
              item.total > 0 && "text-text-primary"
            )}
          >
            {item.mes}: {item.total}
          </span>
        ))}
      </div>
    </div>
  );
}
