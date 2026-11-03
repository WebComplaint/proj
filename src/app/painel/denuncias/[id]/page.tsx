/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a tela de DETALHE de uma denuncia, onde o caso e efetivamente tratado.
 *
 * Reune tudo em um lugar so: o relato completo, data e local, os anexos, a
 * linha do tempo do caso e os campos para mudar status, prioridade e
 * responsavel.
 *
 * Ponto importante para a apresentacao: a linha do tempo aqui mostra TUDO,
 * inclusive as notas internas da equipe (marcadas em vermelho). Ja a tela
 * publica de acompanhamento mostra apenas os itens marcados como publicos.
 * E a mesma informacao com dois niveis de visibilidade.
 *
 * O bloco "Denunciante" so exibe nome, e-mail e telefone quando a denuncia
 * NAO e anonima. Sendo anonima, ele mostra a etiqueta Anonima e, apenas para
 * o administrador, o telefone de contato.
 */

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
import { gerarLinksAnexos } from "@/lib/anexos-storage";
import { isAdmin } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { getPainelSession } from "@/lib/server-auth";

type PainelDenunciaDetalhePageProps = {
  params: {
    id: string;
  };
};

export default async function PainelDenunciaDetalhePage({ params }: PainelDenunciaDetalhePageProps) {
  // BLOCO 1 - Duas consultas ao mesmo tempo:
  //   1. a denuncia completa, com categoria, responsavel, anexos e historico;
  //   2. a lista de usuarios ativos, para preencher o campo "Responsavel".
  const [denuncia, responsaveis, session] = await Promise.all([
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
    }),
    getPainelSession()
  ]);

  // Caso inexistente, ou identificador digitado errado: mostra a pagina 404.
  if (!denuncia) {
    notFound();
  }

  // Os anexos ficam em uma pasta privada: cada um ganha aqui um link
  // temporario, valido por 1 hora, que so a equipe logada recebe.
  const linksAnexos = await gerarLinksAnexos(denuncia.anexos.map((anexo) => anexo.arquivoUrl));

  // BLOCO 2 - Transforma o historico do banco nos itens da linha do tempo.
  // O titulo de cada item e escolhido conforme o que aquele registro e:
  //   houve mudanca de status -> "Status atualizado para ...";
  //   comentario publico      -> "Resposta ao denunciante";
  //   comentario interno      -> "Nota interna".
  //
  // A ultima linha e a mais importante: ela marca cada item como publico ou
  // interno, e e isso que faz as notas da equipe aparecerem com fundo
  // avermelhado, avisando que aquilo NAO e visto por quem denunciou.
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
          {/* BLOCO 3 - O RELATO COMPLETO, exatamente como foi escrito.
              O "whitespace-pre-wrap" preserva as quebras de linha do texto
              original. Sem ele, tudo viraria um paragrafo unico e a leitura
              de um relato longo ficaria muito mais dificil. */}
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
                {denuncia.anexos.map((anexo, indice) => (
                  <a
                    key={anexo.id}
                    className="rounded-calm bg-base p-3 shadow-neuro-sm"
                    href={linksAnexos[indice] ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* Sendo imagem, mostra a previa; sendo PDF, mostra uma
                        caixa escrita PDF. Assim a equipe reconhece o tipo do
                        anexo antes de abrir. */}
                    {anexo.tipoMime.startsWith("image/") && linksAnexos[indice] ? (
                      <Image
                        alt={`Anexo ${anexo.nomeOriginal}`}
                        className="aspect-video w-full rounded-soft object-cover"
                        height={180}
                        src={linksAnexos[indice]!}
                        unoptimized
                        width={320}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-soft bg-sand-100 text-center font-bold text-ocean-900">
                        {anexo.tipoMime.startsWith("image/") ? "Imagem indisponível" : "PDF"}
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

          {/* BLOCO 4 - OS DADOS DO DENUNCIANTE.
              Sendo anonima, o banco nao guardou nome nem e-mail. O unico dado
              guardado e o telefone, obrigatorio, e ele so aparece para o
              ADMINISTRADOR. Professores, coordenadores e diretores veem apenas
              a etiqueta "Anônima", como antes.
              Sendo identificada, os tres campos aparecem para a equipe entrar
              em contato. Este e um bom trecho para mostrar na apresentacao. */}
          <NeuCard title="Denunciante">
            {denuncia.anonima ? (
              <div className="grid gap-4">
                <span className="inline-flex min-h-8 w-fit items-center rounded-full bg-[#D8E4E6] px-3 text-sm font-bold text-ink-600">
                  Anônima
                </span>
                {isAdmin(session?.user.perfil) ? (
                  <dl className="grid gap-4">
                    <InfoItem label="Telefone (visível só para administradores)" value={denuncia.denuncianteTelefone || "Não informado"} />
                  </dl>
                ) : (
                  <p className="text-sm leading-6 text-text-secondary">
                    O telefone de contato desta denúncia fica restrito à administração.
                  </p>
                )}
              </div>
            ) : (
              <dl className="grid gap-4">
                <InfoItem label="Nome" value={denuncia.denuncianteNome || "Não informado"} />
                {/* Avisos por e-mail so saem para e-mail confirmado: a equipe ve
                    aqui se a pessoa vai ou nao recebe-los. */}
                <InfoItem
                  label="E-mail"
                  value={
                    denuncia.denuncianteEmail
                      ? `${denuncia.denuncianteEmail} (${denuncia.denuncianteEmailVerificadoEm ? "confirmado" : "não confirmado, não recebe avisos"})`
                      : "Não informado"
                  }
                />
                <InfoItem label="Telefone" value={denuncia.denuncianteTelefone || "Não informado"} />
              </dl>
            )}
          </NeuCard>
        </aside>
      </section>
    </main>
  );
}

// BLOCO 5 - Um molde de "rotulo e valor" reaproveitado por toda a tela.
// Usa as marcacoes dt e dd, proprias de listas de definicao, o que ajuda o
// leitor de tela a anunciar "Local: pátio" como um par, e nao como duas
// frases soltas.
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soft bg-base p-4 shadow-neuro-inset">
      <dt className="text-sm font-bold text-text-secondary">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-text-primary">{value}</dd>
    </div>
  );
}
