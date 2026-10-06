/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Desenha os dois graficos do painel: barras por categoria e linha por mes.
 *
 * Curiosidade que rende um bom comentario na apresentacao: nenhuma
 * biblioteca de graficos foi usada aqui. As barras sao caixas com largura
 * proporcional e a linha e um desenho vetorial feito a mao no codigo.
 *
 * Isso deixa o site mais leve para abrir no celular do aluno e evita
 * depender de codigo de terceiros. Alem disso, os dois graficos tem
 * descricao em texto para quem usa leitor de tela.
 *
 * Para a apresentacao: leveza e acessibilidade foram escolhas conscientes.
 */

import { cn } from "@/lib/cn";

type CategoryDatum = {
  categoria: string;
  total: number;
};

type MonthDatum = {
  mes: string;
  total: number;
};

// ============================================================
// GRAFICO 1: BARRAS POR CATEGORIA
// ============================================================
export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  // Descobre o maior valor, que sera a barra de 100% de largura.
  // O Math.max(1, ...) evita uma divisao por zero quando nao ha dados.
  const max = Math.max(1, ...data.map((item) => item.total));

  // Sem dados: escreve uma frase explicando, em vez de mostrar um grafico
  // vazio que pareceria um defeito do sistema.
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
          {/* A BARRA. Nao ha biblioteca de graficos aqui: e uma caixa colorida
              dentro de outra, com a largura calculada em porcentagem.
              A conta (valor dividido pelo maior valor, vezes 100) da a
              proporcao. O Math.max(8, ...) garante largura minima de 8%, para
              que uma categoria com poucos casos ainda apareca na tela. */}
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

// ============================================================
// GRAFICO 2: LINHA POR MES
// ============================================================
export function MonthlyLineChart({ data }: { data: MonthDatum[] }) {
  // BLOCO 1 - As medidas do desenho, como uma folha quadriculada.
  // O "padding" e a margem que impede a linha de encostar nas bordas.
  const max = Math.max(1, ...data.map((item) => item.total));
  const width = 360;
  const height = 180;
  const padding = 24;

  // BLOCO 2 - Calcula a posicao de cada ponto na folha.
  // x = a posicao horizontal, distribuindo os 6 meses por igual.
  // y = a altura, proporcional ao numero de denuncias daquele mes.
  // A conta do y comeca em "height -" porque no computador a altura e contada
  // de cima para baixo, ao contrario do grafico, que cresce para cima.
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - (item.total / max) * (height - padding * 2);

    return { ...item, x, y };
  });

  // BLOCO 3 - Monta o caminho da linha, como instrucoes para uma caneta:
  // "M" quer dizer mova ate aqui (o primeiro ponto) e "L" quer dizer trace uma
  // linha ate aqui (todos os demais).
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
      {/* BLOCO 4 - OS MESMOS NUMEROS ESCRITOS EM TEXTO, ABAIXO DO DESENHO.
          Nao e repeticao por acaso. Quem usa leitor de tela nao enxerga o
          desenho, e le esta lista. Alem disso, ela permite conferir o valor
          exato de cada mes sem precisar estimar pela altura da linha. */}
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
