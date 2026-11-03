/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cuida do "ESQUECI MINHA SENHA" da equipe do painel, em dois passos:
 *   1. pedirRedefinicao  -> a pessoa informa o e-mail e recebe um link.
 *   2. redefinirSenha    -> ao abrir o link, ela escolhe a senha nova.
 *
 * O desenho e o mesmo da verificacao de e-mail (lib/verificacao-email.ts):
 * o link carrega um codigo secreto, o banco guarda so a impressao digital
 * dele, e o link vale uma unica vez. A diferenca e o prazo: 1 hora em vez de
 * 24, porque este link da acesso a conta.
 *
 * A troca da senha passa pela mesma funcao protegida do banco usada pelo
 * administrador (app_private.update_staff_user). O site continua sem
 * manipular nem guardar senha nenhuma.
 *
 * Para a apresentacao: e o "esqueci minha senha", sem expor quem tem conta.
 */

import { createHash, randomBytes } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// BLOCO 1 - Por quanto tempo o link vale: 1 hora, em milissegundos.
const VALIDADE_MS = 60 * 60 * 1000;

// BLOCO 2 - A "impressao digital" do codigo (SHA-256), igual a da
// verificacao de e-mail. O banco guarda so isto, nunca o codigo.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// BLOCO 3 - PASSO 1: pedido de redefinicao.
// So envia o link para conta ATIVA. Para e-mail desconhecido ou conta
// desativada, simplesmente nao faz nada. Quem chama esta funcao responde
// sempre a mesma frase, exista a conta ou nao: assim ninguem descobre quais
// e-mails tem acesso ao painel testando o formulario.
export async function pedirRedefinicao(email: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, ativo: true }
  });

  if (!usuario?.ativo) return;

  // 32 bytes aleatorios = 64 caracteres. Impossivel de adivinhar.
  const token = randomBytes(32).toString("hex");

  // Invalida os links anteriores ainda nao usados: so o mais recente vale.
  await prisma.$transaction([
    prisma.redefinicaoSenha.updateMany({
      where: { usuarioId: usuario.id, usadoEm: null },
      data: { expiraEm: new Date() }
    }),
    prisma.redefinicaoSenha.create({
      data: {
        usuarioId: usuario.id,
        email: usuario.email,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + VALIDADE_MS)
      }
    })
  ]);

  await sendEmail({
    to: usuario.email,
    subject: "Redefinição de senha do painel",
    text: [
      "Recebemos um pedido para redefinir a senha da sua conta no painel do Web Complaint.",
      "",
      "Para escolher uma senha nova, abra o link abaixo:",
      getRedefinicaoUrl(token),
      "",
      "O link vale por 1 hora e só pode ser usado uma vez.",
      "Se você não fez este pedido, ignore esta mensagem: sua senha atual continua valendo."
    ].join("\n")
  });
}

// BLOCO 4 - O resultado da troca de senha.
export type ResultadoRedefinicao = { ok: true } | { ok: false; motivo: "invalido" | "expirado" };

// BLOCO 5 - PASSO 2: troca a senha usando o codigo do link.
export async function redefinirSenha(token: string, senha: string): Promise<ResultadoRedefinicao> {
  const redefinicao = await prisma.redefinicaoSenha.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, nome: true, email: true, perfil: true, ativo: true } } }
  });

  if (!redefinicao || redefinicao.usadoEm || !redefinicao.usuario.ativo) return { ok: false, motivo: "invalido" };
  if (redefinicao.expiraEm <= new Date()) return { ok: false, motivo: "expirado" };

  // O e-mail mudou depois que o link foi enviado? Entao o link nao vale mais.
  const { usuario } = redefinicao;
  if (usuario.email.toLowerCase() !== redefinicao.email.toLowerCase()) return { ok: false, motivo: "invalido" };

  // Tudo ou nada: marcar o link como usado e trocar a senha acontecem juntos.
  // O "usadoEm: null" no filtro impede que dois cliques simultaneos usem o
  // mesmo link duas vezes.
  const agora = new Date();
  const trocada = await prisma.$transaction(async (tx) => {
    const { count } = await tx.redefinicaoSenha.updateMany({
      where: { id: redefinicao.id, usadoEm: null },
      data: { usadoEm: agora }
    });

    if (count === 0) return false;

    // Troca a senha pela funcao protegida do banco, repetindo nome, e-mail,
    // cargo e situacao atuais: so a senha muda.
    await tx.$queryRaw`
      SELECT * FROM app_private.update_staff_user(
        ${usuario.id},
        ${usuario.nome},
        ${usuario.email},
        ${senha},
        CAST(${usuario.perfil} AS "Perfil"),
        ${usuario.ativo}
      )
    `;

    // Quem abriu o link provou que o e-mail e seu. Se a confirmacao de
    // e-mail ainda estava pendente, ela fica resolvida tambem.
    await tx.usuario.updateMany({
      where: { id: usuario.id, emailVerificadoEm: null },
      data: { emailVerificadoEm: agora }
    });

    return true;
  });

  return trocada ? { ok: true } : { ok: false, motivo: "invalido" };
}

// BLOCO 6 - Monta o link que vai dentro do e-mail.
function getRedefinicaoUrl(token: string) {
  return `${getAppUrl()}/redefinir-senha?token=${token}`;
}
