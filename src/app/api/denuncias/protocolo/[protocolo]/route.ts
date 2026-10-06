/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Responde a consulta publica por protocolo. E a unica rota que entrega
 * informacao de uma denuncia sem exigir login, e por isso ela e a mais
 * cuidadosa do sistema.
 *
 * Tres protecoes atuam aqui:
 *
 *   1. LIMITE DE TENTATIVAS: no maximo 5 consultas a cada 10 minutos por
 *      origem. Impede que alguem teste codigos ate acertar.
 *
 *   2. FORMATO OBRIGATORIO: o codigo precisa seguir o padrao DEN-AAAA-XXXXXX.
 *      Qualquer coisa fora disso e recusada antes de chegar ao banco.
 *
 *   3. RESPOSTA MINIMA: repare no bloco select mais abaixo. Ele devolve
 *      apenas protocolo, status, prioridade, data, categoria e o historico
 *      marcado como publico. O texto do relato, os anexos, as notas internas
 *      e os dados do denunciante NAO saem daqui de jeito nenhum.
 *
 * Para a apresentacao: mostrar este arquivo prova que a consulta publica
 * nao vaza o conteudo da denuncia.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { allowRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { protocoloSchema } from "@/lib/validacoes";

type ProtocoloRouteContext = {
  params: {
    protocolo: string;
  };
};

// GET = "me traga uma informacao". E o verbo usado para consultar.
export async function GET(request: Request, { params }: ProtocoloRouteContext) {
  // BLOCO 1 - Descobre de onde veio o pedido, para poder contar as tentativas.
  // "x-forwarded-for" e o cabecalho que carrega o endereco de internet real de
  // quem acessou, mesmo quando o pedido passou por servidores intermediarios.
  // Ele pode trazer varios enderecos separados por virgula; o primeiro e o da
  // pessoa. Sem esse dado, usa "local", situacao dos testes na propria maquina.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "local";

  // BLOCO 2 - Pergunta ao controle de tentativas se essa origem ainda pode
  // consultar (o limite e de 5 consultas a cada 10 minutos).
  const rateLimit = allowRequest(`protocolo:${clientIp}`);

  // Estourou o limite: recusa com o codigo 429, que significa exatamente
  // "voce fez pedidos demais". O cabecalho Retry-After informa em quantos
  // segundos podera tentar de novo, e a tela transforma isso em uma frase.
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos antes de consultar novamente." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  try {
    // BLOCO 3 - Confere o formato do codigo digitado antes de tocar no banco.
    // Se nao seguir o padrao DEN-AAAA-XXXXXX, a consulta nem acontece.
    const { protocolo } = protocoloSchema.parse({ protocolo: params.protocolo });

    // BLOCO 4 - A CONSULTA. Este e o trecho mais importante do arquivo.
    // O bloco "select" abaixo e uma lista de permissao: sai do banco APENAS o
    // que esta escrito nele. Compare com o que a denuncia tem guardado e veja
    // o que ficou de fora de proposito:
    //
    //   FICA DE FORA: o texto do relato, os anexos, o local, os envolvidos,
    //                 o nome, o e-mail e o telefone de quem denunciou.
    //
    // Nao e a tela que esconde essas informacoes. Elas nunca saem do banco.
    // Mesmo alguem inspecionando o trafego do site nao as encontraria aqui.
    const denuncia = await prisma.denuncia.findUnique({
      where: { protocolo },
      select: {
        protocolo: true,
        status: true,
        prioridade: true,
        criadoEm: true,
        categoria: {
          select: {
            nome: true,
            slug: true
          }
        },
        historico: {
          // E aqui que as notas internas da equipe sao filtradas: so entram os
          // itens marcados como publicos por quem os escreveu.
          where: {
            publico: true
          },
          orderBy: {
            criadoEm: "asc"
          },
          select: {
            statusAnterior: true,
            statusNovo: true,
            comentario: true,
            criadoEm: true
          }
        }
      }
    });

    // BLOCO 5 - Protocolo nao encontrado: erro 404.
    // Repare na redacao da mensagem. Ela nao diz "esse protocolo nao existe",
    // e sim que nao foi possivel mostrar informacoes. A diferenca e sutil e
    // proposital: confirmar quais codigos existem ajudaria alguem que esta
    // testando codigos a saber quando acertou.
    if (!denuncia) {
      return NextResponse.json(
        { erro: "Não foi possível mostrar informações para esse protocolo. Confira o código e tente novamente." },
        { status: 404 }
      );
    }

    // BLOCO 6 - Deu tudo certo: devolve os dados publicos do caso.
    return NextResponse.json(denuncia);
  } catch (error) {
    // BLOCO 7 - Codigo fora do formato: erro 400 (pedido mal formado).
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    // Falha inesperada: erro 500, com mensagem generica e sem detalhe tecnico.
    return NextResponse.json({ erro: "Não foi possível consultar o protocolo agora." }, { status: 500 });
  }
}
