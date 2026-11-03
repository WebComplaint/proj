/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Envia os avisos por e-mail para quem se identificou ao denunciar.
 * Sao dois tipos de aviso: o status do caso mudou, ou a escola escreveu
 * uma resposta publica.
 *
 * Detalhe importante: se o servico de e-mail nao estiver configurado, o
 * sistema NAO quebra. Ele apenas escreve a mensagem no registro do servidor
 * e continua funcionando. Isso permite demonstrar o sistema sem depender
 * de um servico externo.
 *
 * Quem escolheu denunciar de forma anonima nunca recebe e-mail, porque o
 * sistema nem chegou a guardar um endereco.
 *
 * Para a apresentacao: e o carteiro do sistema.
 */

import type { StatusDenuncia } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { statusLabelMap } from "@/lib/denuncias";

// BLOCO 1 - O conteudo de um e-mail: para quem, com que assunto e qual texto.
export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

// BLOCO 2 - O resultado do envio.
// "provider" diz por onde a mensagem saiu: pelo servico de e-mail de verdade
// (resend) ou apenas para o registro do servidor (console), no modo de teste.
type EmailResult = {
  sent: boolean;
  provider: "resend" | "console";
};

// BLOCO 3 - O carteiro do sistema: envia um e-mail.
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  // Le a configuracao do servidor: quem assina o e-mail e a chave do servico.
  const from = process.env.EMAIL_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;

  // MODO DE DEMONSTRACAO: sem servico de e-mail configurado, o sistema apenas
  // escreve a mensagem no registro do servidor e devolve "nao enviado".
  // E uma escolha deliberada: assim o projeto roda na maquina de qualquer
  // pessoa, ou na apresentacao do TCC, sem contratar servico nenhum. E o mais
  // importante, uma falha de e-mail nunca impede a denuncia de ser salva.
  if (!from || !resendApiKey) {
    console.info("[email:console]", payload);

    return {
      sent: false,
      provider: "console"
    };
  }

  // MODO REAL: entrega a mensagem ao servico Resend, que despacha o e-mail.
  // A chave secreta vai no cabecalho Authorization, como um cracha de acesso.
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text
    })
  });

  // Se o servico recusou, avisa quem chamou. Quem chama sempre trata esse
  // erro sem derrubar a operacao principal.
  if (!response.ok) {
    throw new Error("Não foi possível enviar a notificação por e-mail.");
  }

  return {
    sent: true,
    provider: "resend"
  };
}

// BLOCO 4 - Aviso de MUDANCA DE STATUS.
// Monta a mensagem linha a linha, como um bilhete.
// O .filter(Boolean) no fim descarta as linhas vazias: quando a equipe nao
// escreveu comentario, aquela linha simplesmente nao aparece no e-mail.
//
// Repare no que a mensagem NAO diz: ela nao repete o conteudo da denuncia.
// E-mail passa por varios servidores no caminho e pode ser lido por quem tem
// acesso a caixa de entrada, entao ele so avisa que houve novidade e convida
// a pessoa a ver o resto no site, pelo protocolo.
export async function notifyStatusChange({
  to,
  protocolo,
  status,
  comentario
}: {
  to: string;
  protocolo: string;
  status: StatusDenuncia;
  comentario?: string | null;
}) {
  const publicUrl = getPublicProtocolUrl(protocolo);
  const statusLabel = statusLabelMap[status];

  return sendEmail({
    to,
    subject: `Atualização da denúncia ${protocolo}`,
    text: [
      `Sua denúncia ${protocolo} teve uma atualização de status.`,
      "",
      `Novo status: ${statusLabel}.`,
      comentario ? `Mensagem da escola: ${comentario}` : null,
      "",
      `Acompanhe pelo protocolo: ${publicUrl}`,
      "",
      "Esta mensagem não substitui atendimento de emergência."
    ]
      .filter(Boolean)
      .join("\n")
  });
}

// BLOCO 5 - Aviso de RESPOSTA PUBLICA da escola.
// Mesma logica do bloco anterior. Aqui o texto escrito pela equipe vai junto,
// porque ele ja foi marcado como publico por quem o escreveu.
// A ultima linha lembra de novo que o canal nao atende emergencia. Essa frase
// se repete em todos os e-mails de proposito.
export async function notifyPublicResponse({
  to,
  protocolo,
  comentario
}: {
  to: string;
  protocolo: string;
  comentario: string;
}) {
  const publicUrl = getPublicProtocolUrl(protocolo);

  return sendEmail({
    to,
    subject: `Nova resposta sobre a denúncia ${protocolo}`,
    text: [
      `A escola registrou uma resposta pública para a denúncia ${protocolo}.`,
      "",
      comentario,
      "",
      `Acompanhe pelo protocolo: ${publicUrl}`,
      "",
      "Esta mensagem não substitui atendimento de emergência."
    ].join("\n")
  });
}

// BLOCO 6 - Monta o link de acompanhamento que vai dentro do e-mail.
// O endereco do site vem de getAppUrl (lib/app-url.ts), que nunca deixa um
// "localhost" ir parar no e-mail quando o sistema roda na Vercel.
// O encodeURIComponent trata caracteres especiais do protocolo.
function getPublicProtocolUrl(protocolo: string) {
  return `${getAppUrl()}/acompanhar/${encodeURIComponent(protocolo)}`;
}
