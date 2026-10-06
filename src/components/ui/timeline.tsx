/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Desenha a linha do tempo do caso, um item embaixo do outro em ordem
 * cronologica.
 *
 * Cada item mostra a etiqueta Publico ou Interno, e os itens internos ainda
 * recebem fundo avermelhado. E um lembrete visual constante para a equipe
 * sobre o que a pessoa que denunciou consegue ou nao consegue ver.
 *
 * Para a apresentacao: e o historico completo do caso.
 */

import { cn } from "@/lib/cn";

// BLOCO 1 - O formato de um item da linha do tempo.
// O campo "visibility" e o mais importante: ele diz se aquele registro pode
// ser visto por quem denunciou (public) ou se e so da equipe (internal).
type TimelineItem = {
  title: string;
  description: string;
  date: string;
  visibility: "public" | "internal";
};

// BLOCO 2 - Desenha a lista em ordem cronologica, com a linha vertical a
// esquerda ligando os registros.
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative grid gap-4 border-l border-ocean-600/25 pl-5">
      {items.map((item) => (
        <li key={`${item.title}-${item.date}`} className="relative">
          <span
            className={cn(
              "absolute -left-[1.58rem] top-1.5 h-3 w-3 rounded-full",
              item.visibility === "public" ? "bg-ocean-600" : "bg-danger-600"
            )}
            aria-hidden="true"
          />
          {/* O FUNDO MUDA CONFORME A VISIBILIDADE.
              Publico: fundo claro comum. Interno: fundo avermelhado.
              E um lembrete visual permanente para a equipe, que passa o dia
              nesta tela, sobre o que a pessoa que denunciou consegue ou nao
              consegue ver. */}
          <div className={cn("rounded-soft p-4", item.visibility === "public" ? "bg-base shadow-neuro-sm" : "border border-danger-600/25 bg-danger-100")}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold">{item.title}</h3>
              <span className="text-sm text-text-secondary">{item.date}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
            <span className="mt-3 inline-flex rounded-full bg-white/45 px-3 py-1 text-xs font-bold text-text-primary">
              {/* Alem da cor, a palavra escrita. Cor sozinha nunca basta:
                  uma pessoa daltonica nao veria diferenca entre os dois. */}
              {item.visibility === "public" ? "Público" : "Interno"}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
