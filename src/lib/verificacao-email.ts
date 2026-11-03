/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Confirma que um e-mail pertence a quem o informou. Vale para os dois
 * publicos do sistema:
 *   USUARIO     -> funcionario do painel. Confirmar e OBRIGATORIO: sem isso
 *                  o painel fica bloqueado.
 *   DENUNCIANTE -> quem fez uma denuncia identificada. Confirmar e OPCIONAL,
 *                  mas os avisos por e-mail so saem para e-mail confirmado.
 *
 * Como funciona, em tres passos:
 *   1. O sistema sorteia um codigo secreto e manda por e-mail um link com ele.
 *   2. No banco fica guardada so a "impressao digital" (hash) do codigo.
 *   3. Quando a pessoa abre o link e confirma, o sistema confere a impressao
 *      digital, a validade (24h) e se o link ainda nao foi usado.
 *
 * Para a apresentacao: e o "confirme que este e-mail e seu".
 */

import { createHash, randomBytes } from "crypto";
import type { TipoVerificacaoEmail } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// BLOCO 1 - Por quanto tempo o link vale: 24 horas, em milissegundos.
const VALIDADE_MS = 24 * 60 * 60 * 1000;

// BLOCO 2 - A "impressao digital" do codigo.
// O SHA-256 transforma o codigo em outro texto, sempre igual para o mesmo
// codigo, mas impossivel de desfazer. O banco guarda so isto.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type Alvo =
  | { tipo: "USUARIO"; usuarioId: string; email: string }
  | { tipo: "DENUNCIANTE"; denunciaId: string; email: string; protocolo: string };

// BLOCO 3 - Cria um link novo e envia por e-mail.
// Antes, invalida os links pendentes do mesmo alvo: so o mais recente vale.
export async function enviarVerificacao(alvo: Alvo) {
  // 32 bytes aleatorios = 64 caracteres. Impossivel de adivinhar.
  const token = randomBytes(32).toString("hex");
  const filtroAlvo = alvo.tipo === "USUARIO" ? { usuarioId: alvo.usuarioId } : { denunciaId: alvo.denunciaId };

  await prisma.$transaction([
    prisma.verificacaoEmail.updateMany({
      where: { ...filtroAlvo, usadoEm: null },
      data: { expiraEm: new Date() }
    }),
    prisma.verificacaoEmail.create({
      data: {
        ...filtroAlvo,
        tipo: alvo.tipo,
        email: alvo.email,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + VALIDADE_MS)
      }
    })
  ]);

  const link = getVerificacaoUrl(token);

  // O texto muda conforme o publico. O do denunciante, como nos outros
  // avisos, nao repete nada do conteudo da denuncia.
  const texto =
    alvo.tipo === "USUARIO"
      ? [
          "Sua conta no painel do Web Complaint foi criada ou teve o e-mail alterado.",
          "",
          "Para liberar o acesso, confirme que este e-mail é seu:",
          link,
          "",
          "O link vale por 24 horas. Se você não esperava esta mensagem, ignore-a."
        ]
      : [
          `Você informou este e-mail ao registrar a denúncia ${alvo.protocolo}.`,
          "",
          "Confirme que o e-mail é seu para receber avisos sobre o andamento:",
          link,
          "",
          "O link vale por 24 horas. Se não foi você, ignore esta mensagem: nenhum aviso será enviado.",
          "",
          "Esta mensagem não substitui atendimento de emergência."
        ];

  return sendEmail({
    to: alvo.email,
    subject: alvo.tipo === "USUARIO" ? "Confirme seu e-mail do painel" : "Confirme seu e-mail para receber avisos",
    text: texto.join("\n")
  });
}

// BLOCO 4 - O resultado da confirmacao.
// Os motivos de recusa sao propositalmente genericos: nao revelam se um
// e-mail ou uma denuncia existe.
export type ResultadoVerificacao =
  | { ok: true; tipo: TipoVerificacaoEmail }
  | { ok: false; motivo: "invalido" | "expirado" };

// BLOCO 5 - Confere o link e marca o e-mail como confirmado.
export async function confirmarVerificacao(token: string): Promise<ResultadoVerificacao> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, motivo: "invalido" };

  const verificacao = await prisma.verificacaoEmail.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      usuario: { select: { email: true } },
      denuncia: { select: { denuncianteEmail: true } }
    }
  });

  if (!verificacao || verificacao.usadoEm) return { ok: false, motivo: "invalido" };
  if (verificacao.expiraEm <= new Date()) return { ok: false, motivo: "expirado" };

  // O e-mail mudou depois que o link foi enviado? Entao o link nao vale mais.
  const emailAtual = verificacao.usuario?.email ?? verificacao.denuncia?.denuncianteEmail;
  if (!emailAtual || emailAtual.toLowerCase() !== verificacao.email.toLowerCase()) {
    return { ok: false, motivo: "invalido" };
  }

  const agora = new Date();

  // Tudo ou nada: marca o link como usado e o e-mail como confirmado juntos.
  // O "usadoEm: null" no filtro impede que dois cliques simultaneos usem o
  // mesmo link duas vezes.
  const confirmado = await prisma.$transaction(async (tx) => {
    const { count } = await tx.verificacaoEmail.updateMany({
      where: { id: verificacao.id, usadoEm: null },
      data: { usadoEm: agora }
    });

    if (count === 0) return false;

    if (verificacao.usuarioId) {
      await tx.usuario.update({ where: { id: verificacao.usuarioId }, data: { emailVerificadoEm: agora } });
    } else if (verificacao.denunciaId) {
      await tx.denuncia.update({
        where: { id: verificacao.denunciaId },
        data: { denuncianteEmailVerificadoEm: agora }
      });
    }

    return true;
  });

  return confirmado ? { ok: true, tipo: verificacao.tipo } : { ok: false, motivo: "invalido" };
}

// BLOCO 6 - Monta o link que vai dentro do e-mail.
function getVerificacaoUrl(token: string) {
  return `${getAppUrl()}/verificar-email?token=${token}`;
}
