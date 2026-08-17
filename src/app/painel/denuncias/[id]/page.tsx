import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseActions, CommentForm } from "@/components/painel/case-actions";
import { NeuCard, PrioridadeBadge, StatusBadge, Timeline } from "@/components/ui";
import {
  formatDateTime,
  formatFileSize,
  prioridadeLabelMap,
  prioridadeUiMap,
  statusLabelMap,
  statusUiMap
} from "@/lib/denuncias";
import { prisma } from "@/lib/prisma";

type PainelDenunciaDetalhePageProps = {
  params: {
    id: string;
  };
};

export default async function PainelDenunciaDetalhePage({ params }: PainelDenunciaDetalhePageProps) {
  const [denuncia, responsaveis] = await Promise.all([
    prisma.denuncia.findUnique({
      where: { id: params.id },
      include: {
        categoria: true,
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        anexos: {
          orderBy: {
            criadoEm: "asc"
          }
        },
        historico: {
          orderBy: {
            criadoEm: "asc"
          },
          include: {
            usuario: {
              select: {
                nome: true
              }
            }
          }
        }
      }
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true
      }
    })
  ]);

  if (!denuncia) {
    notFound();
  }

  const timelineItems = denuncia.historico.map((item) => ({
    title: item.statusNovo
      ? `Status atualizado para ${statusLabelMap[item.statusNovo]}`
      : item.publico
        ? "Resposta ao denunciante"
        : "Nota interna",
    description: [
      item.comentario || "Registro sem comentário.",
      item.usuario?.nome ? `Responsável: ${item.usuario.nome}.` : null
    ]
      .filter(Boolean)
      .join(" "),
    date: formatDateTime(item.criadoEm),
    visibility: item.publico ? ("public" as const) : ("internal" as const)
  }));

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <Link className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-3" href="/painel/denuncias">
          Voltar para denúncias
        </Link>
        <p className="protocol text-sm font-bold text-text-secondary">{denuncia.protocolo}</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="grid gap-6">
          <NeuCard title="Descrição completa" description={denuncia.categoria.nome}>
            <p className="whitespace-pre-wrap text-base leading-7 text-text-primary">{denuncia.descricao}</p>
          </NeuCard>

          <NeuCard title="Detalhes">
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Data aproximada" value={denuncia.dataOcorrido ? formatDateTime(denuncia.dataOcorrido) : "Não informado"} />
              <InfoItem label="Local" value={denuncia.local || "Não informado"} />
              <div className="sm:col-span-2">
                <InfoItem label="Pessoas envolvidas" value={denuncia.envolvidos || "Não informado"} />
              </div>
            </dl>
          </NeuCard>

          <NeuCard title="Anexos" description="Arquivos enviados pelo denunciante.">
            {denuncia.anexos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {denuncia.anexos.map((anexo) => (
                  <a
                    key={anexo.id}
                    className="rounded-calm bg-base p-3 shadow-neuro-sm"
                    href={anexo.arquivoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {anexo.tipoMime.startsWith("image/") ? (
                      <Image
                        alt={`Anexo ${anexo.nomeOriginal}`}
                        className="aspect-video w-full rounded-soft object-cover"
                        height={180}
                        src={anexo.arquivoUrl}
                        width={320}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-soft bg-sand-100 text-center font-bold text-ocean-900">
                        PDF
                      </div>
                    )}
                    <p className="mt-3 truncate text-sm font-bold">{anexo.nomeOriginal}</p>
                    <p className="mt-1 text-sm text-text-secondary">{formatFileSize(anexo.tamanho)}</p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
                Nenhum anexo foi enviado neste caso.
              </p>
            )}
          </NeuCard>

          <NeuCard title="Linha do tempo do caso" description="Histórico completo para a equipe. Itens internos não aparecem na consulta pública.">
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset">
                Ainda não há histórico registrado além da abertura.
              </p>
            )}
          </NeuCard>

          <NeuCard title="Interação com o caso" description="Escolha claramente se a mensagem é interna ou pública.">
            <CommentForm denunciaId={denuncia.id} />
          </NeuCard>
        </div>

        <aside className="grid gap-6">
          <NeuCard title="Status e prioridade">
            <div className="mb-5 flex flex-wrap gap-3">
              <StatusBadge status={statusUiMap[denuncia.status]} />
              <PrioridadeBadge prioridade={prioridadeUiMap[denuncia.prioridade]} />
            </div>
            <CaseActions
              denunciaId={denuncia.id}
              prioridade={denuncia.prioridade}
              responsavelId={denuncia.responsavelId}
              responsaveis={responsaveis}
              status={denuncia.status}
            />
          </NeuCard>

          <NeuCard title="Resumo">
            <dl className="grid gap-4">
              <InfoItem label="Categoria" value={denuncia.categoria.nome} />
              <InfoItem label="Data de abertura" value={formatDateTime(denuncia.criadoEm)} />
              <InfoItem label="Responsável" value={denuncia.responsavel?.nome ?? "Sem responsável"} />
              <InfoItem label="Prioridade atual" value={prioridadeLabelMap[denuncia.prioridade]} />
              <InfoItem label="Status atual" value={statusLabelMap[denuncia.status]} />
            </dl>
          </NeuCard>

          <NeuCard title="Denunciante">
            {denuncia.anonima ? (
              <span className="inline-flex min-h-8 items-center rounded-full bg-[#D8E4E6] px-3 text-sm font-bold text-ink-600">
                Anônima
              </span>
            ) : (
              <dl className="grid gap-4">
                <InfoItem label="Nome" value={denuncia.denuncianteNome || "Não informado"} />
                <InfoItem label="E-mail" value={denuncia.denuncianteEmail || "Não informado"} />
                <InfoItem label="Telefone" value={denuncia.denuncianteTelefone || "Não informado"} />
              </dl>
            )}
          </NeuCard>
        </aside>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soft bg-base p-4 shadow-neuro-inset">
      <dt className="text-sm font-bold text-text-secondary">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-text-primary">{value}</dd>
    </div>
  );
}
