import type { StatusDenuncia } from "@prisma/client";
import { statusLabelMap } from "@/lib/denuncias";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

type EmailResult = {
  sent: boolean;
  provider: "resend" | "console";
};

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!from || !resendApiKey) {
    console.info("[email:console]", payload);

    return {
      sent: false,
      provider: "console"
    };
  }

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

  if (!response.ok) {
    throw new Error("Não foi possível enviar a notificação por e-mail.");
  }

  return {
    sent: true,
    provider: "resend"
  };
}

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

function getPublicProtocolUrl(protocolo: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}/acompanhar/${encodeURIComponent(protocolo)}`;
}
