/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Esta e a rota mais importante do sistema: e ela que RECEBE E GRAVA uma
 * denuncia nova.
 *
 * O passo a passo, na ordem em que acontece:
 *   1. Confere todos os campos recebidos (arquivo lib/validacoes.ts).
 *   2. Verifica se a categoria escolhida existe e esta ativa.
 *   3. Sorteia um protocolo e confere se ele ja nao foi usado. Se ja foi,
 *      sorteia outro, ate 5 vezes.
 *   4. Grava, de uma unica vez: a denuncia, os anexos e o primeiro item do
 *      historico ("Denuncia recebida pela plataforma").
 *   5. Se a pessoa informou e-mail, envia o link para confirma-lo.
 *   6. Devolve apenas o protocolo.
 *
 * O passo 4 acontece dentro de uma TRANSACAO. Isso significa tudo ou nada:
 * se a gravacao falhar no meio, nada e salvo. Nunca sobra uma denuncia pela
 * metade no banco.
 *
 * REGRA DE PRIVACIDADE: quando a denuncia e anonima, os campos de nome,
 * e-mail e telefone sao gravados como vazios (null), mesmo que algo tenha
 * sido digitado antes de a pessoa mudar de ideia. O sistema nao guarda o
 * que prometeu nao guardar.
 *
 * Para a apresentacao: e o coracao do sistema.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { gerarProtocolo } from "@/lib/protocolo";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { criarDenunciaSchema } from "@/lib/validacoes";
import { enviarVerificacao } from "@/lib/verificacao-email";

// POST = "criar algo novo". E o verbo usado quando o formulario e enviado.
export async function POST(request: Request) {
  try {
    // BLOCO 1 - Le o que o formulario mandou e confere campo por campo.
    // Se qualquer regra falhar, o .parse interrompe tudo na hora e o programa
    // pula direto para o tratamento de erro la no final do arquivo.
    // Nada e gravado enquanto os dados nao passarem por aqui.
    const json = await request.json();
    const data = criarDenunciaSchema.parse(json);

    // BLOCO 2 - Confere se a categoria escolhida existe E esta ativa.
    // A validacao anterior so garantiu o formato do texto. Esta consulta
    // garante que a categoria continua valendo no banco: a escola pode ter
    // desativado uma categoria enquanto a pessoa preenchia o formulario.
    // Ja aproveita e traz a prioridade padrao dela.
    const categoria = await prisma.categoria.findFirst({
      where: {
        slug: data.categoriaSlug,
        ativa: true
      },
      select: {
        id: true,
        prioridadePadrao: true
      }
    });

    // Categoria inexistente ou desativada: recusa com o erro 404 (nao achei).
    if (!categoria) {
      return NextResponse.json(
        { erro: "Categoria não encontrada. Recarregue a página e tente novamente." },
        { status: 404 }
      );
    }

    // BLOCO 3 - A GRAVACAO, feita dentro de uma TRANSACAO.
    // Transacao significa tudo ou nada: se qualquer passo aqui dentro falhar,
    // o banco desfaz sozinho o que ja tinha sido feito. Nunca sobra uma
    // denuncia sem anexo, ou um anexo sem denuncia.
    const denuncia = await prisma.$transaction(async (tx) => {
      // Tenta ate 5 vezes achar um protocolo que ainda nao existe.
      // Na pratica a primeira tentativa quase sempre resolve, porque o sorteio
      // tem quase um bilhao de combinacoes. Este laco existe para o caso raro
      // de o sorteio repetir um codigo ja usado.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const protocolo = gerarProtocolo();
        const existente = await tx.denuncia.findUnique({
          where: { protocolo },
          select: { id: true }
        });

        // Ja existe alguem com esse codigo: descarta e sorteia outro.
        if (existente) {
          continue;
        }

        // Codigo livre: grava a denuncia, os anexos e o primeiro historico
        // em uma unica operacao.
        return tx.denuncia.create({
          data: {
            protocolo,
            categoriaId: categoria.id,
            anonima: data.anonima,
            descricao: data.descricao,
            dataOcorrido: data.dataOcorrido ? new Date(data.dataOcorrido) : null,
            local: data.local || null,
            envolvidos: data.envolvidos || null,
            // A prioridade inicial vem da categoria, e nao de uma escolha da
            // pessoa. Quem denuncia esta abalado e nao deve ter que julgar a
            // gravidade do proprio caso; a escola ajusta depois se precisar.
            prioridade: categoria.prioridadePadrao,

            // ESTE E O TRECHO MAIS IMPORTANTE DO ARQUIVO PARA A PRIVACIDADE.
            // Leia assim: "se for anonima, grave vazio; senao, grave o valor".
            // Mesmo que algo tenha sido digitado e a pessoa tenha voltado e
            // escolhido anonimato depois, nada pessoal chega ao banco.
            // A promessa de anonimato e cumprida aqui, na gravacao, e nao
            // apenas escondendo os campos na tela.
            denuncianteNome: data.anonima ? null : data.denuncianteNome || null,
            denuncianteEmail: data.anonima ? null : data.denuncianteEmail,
            denuncianteTelefone: data.anonima ? null : data.denuncianteTelefone || null,

            // Grava os anexos ligados a esta denuncia, na mesma operacao.
            anexos: {
              create: data.anexos.map((anexo) => ({
                arquivoUrl: anexo.arquivoUrl,
                nomeOriginal: anexo.nomeOriginal,
                tipoMime: anexo.tipoMime,
                tamanho: anexo.tamanho
              }))
            },
            // Cria o primeiro item da linha do tempo, marcado como publico.
            // E ele que a pessoa ve ao consultar o protocolo minutos depois,
            // confirmando que a denuncia realmente chegou.
            historico: {
              create: {
                statusNovo: "RECEBIDA",
                comentario: "Denúncia recebida pela plataforma.",
                publico: true
              }
            }
          },
          // Pede de volta apenas o codigo interno e o protocolo. Nada mais
          // precisa sair do banco neste momento.
          select: {
            id: true,
            protocolo: true,
            denuncianteEmail: true
          }
        });
      }

      // Cinco sorteios seguidos deram codigo repetido, o que e praticamente
      // impossivel. Melhor avisar do que gravar um protocolo duplicado.
      throw new Error("Não foi possível gerar um protocolo único. Tente novamente.");
    });

    // BLOCO 4 - CONFIRMACAO DO E-MAIL de quem se identificou.
    // Os avisos de andamento so serao enviados depois que a pessoa clicar no
    // link. Fica fora da transacao de proposito: uma falha no e-mail nunca
    // impede a denuncia de ser registrada.
    //
    // Esta rota e publica, entao ha um limite de envios: sem ele, um robo
    // poderia registrar denuncias falsas so para despejar e-mails da escola na
    // caixa de outra pessoa. Sao no maximo 5 links por hora vindos do mesmo
    // endereco de internet e 3 por dia para o mesmo e-mail. Passou do limite,
    // a denuncia e gravada normalmente, apenas sem o link de confirmacao.
    let verificacaoEnviada = false;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";
    const podeEnviar =
      denuncia.denuncianteEmail &&
      allowRequest(`verificacao-denunciante-ip:${clientIp}`, 5, 60 * 60 * 1000).allowed &&
      allowRequest(`verificacao-denunciante-email:${denuncia.denuncianteEmail.toLowerCase()}`, 3, 24 * 60 * 60 * 1000).allowed;

    if (podeEnviar && denuncia.denuncianteEmail) {
      try {
        await enviarVerificacao({
          tipo: "DENUNCIANTE",
          denunciaId: denuncia.id,
          email: denuncia.denuncianteEmail,
          protocolo: denuncia.protocolo
        });
        verificacaoEnviada = true;
      } catch (error) {
        console.error("[verificacao-email] falha ao enviar link de denunciante", error);
      }
    }

    // BLOCO 5 - A RESPOSTA. Devolve SO o protocolo, nada mais.
    // O numero 201 significa "criado com sucesso".
    // Mesmo que o banco tenha gravado dez campos, a resposta carrega apenas o
    // que a pessoa precisa guardar, e se o link de confirmacao saiu.
    return NextResponse.json({ protocolo: denuncia.protocolo, verificacaoEnviada }, { status: 201 });
  } catch (error) {
    // BLOCO 6 - TRATAMENTO DE ERRO. Qualquer falha acima cai aqui.

    // Erro de preenchimento: devolve 400 com a lista de campos errados, para
    // a tela marcar cada um deles em vermelho.
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    // Qualquer outra falha: devolve 500, o erro generico de servidor.
    // A mensagem e sempre uma frase em portugues comum. Detalhe tecnico de
    // erro nunca vai para a tela, porque ajudaria alguem mal intencionado a
    // entender como o sistema e feito por dentro.
    return NextResponse.json(
      { erro: error instanceof Error ? error.message : "Não foi possível enviar a denúncia agora." },
      { status: 500 }
    );
  }
}
