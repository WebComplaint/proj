/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Cria, lista e atualiza os usuarios do painel. Rota exclusiva do
 * administrador.
 *
 * Aqui existe um detalhe tecnico que vale explicar na apresentacao. Criar um
 * usuario significa gravar em dois lugares ao mesmo tempo: a conta de login
 * (com a senha) e a ficha do funcionario. Se so um dos dois desse certo, o
 * sistema ficaria com um usuario quebrado.
 *
 * Para evitar isso, as duas gravacoes foram colocadas dentro de uma funcao
 * protegida do proprio banco de dados, chamada create_staff_user. O site
 * apenas pede que ela seja executada. Assim o site nunca manipula senhas
 * diretamente, e a operacao inteira e tudo ou nada.
 *
 * A senha nunca e devolvida nas respostas desta rota.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { usuarioAdminSchema } from "@/lib/validacoes";
import { enviarVerificacao } from "@/lib/verificacao-email";

// BLOCO 1 - O formato do usuario devolvido por esta rota.
// Repare: a senha nao esta aqui, e nunca estara em resposta nenhuma.
type UsuarioResult = {
  id: string;
  nome: string;
  email: string;
  perfil: "PROFESSOR" | "COORDENADOR" | "DIRETOR" | "ADMIN";
  ativo: boolean;
};

// ===================== PARTE 1: LISTAR USUARIOS =====================
export async function GET() {
  // So administrador entra. Esta lista mostra quem tem acesso ao sistema.
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  // Traz os usuarios com os ativos primeiro e, dentro de cada grupo, em ordem
  // alfabetica. Quem foi desativado desce para o fim da lista sem sumir.
  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true
    }
  });

  return NextResponse.json({ usuarios });
}

// ===================== PARTE 2: CRIAR USUARIO =====================
export async function POST(request: Request) {
  // So administrador cria contas. Sem essa trava, qualquer professor poderia
  // criar um usuario administrador para si mesmo.
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // Confere nome, e-mail, senha e cargo.
    const data = usuarioAdminSchema.parse(await request.json());

    // Ao CRIAR, a senha e obrigatoria (ao editar, nao e).
    // Sem ela a conta nasceria sem forma de acesso.
    if (!data.senha) {
      return NextResponse.json(
        { erro: "Informe uma senha inicial para criar o usuário.", campos: { senha: "Informe uma senha inicial." } },
        { status: 400 }
      );
    }

    // AQUI ESTA O PONTO TECNICO MAIS INTERESSANTE DESTE ARQUIVO.
    //
    // Criar um usuario significa gravar em DOIS lugares: a conta de login
    // (que guarda a senha) e a ficha do funcionario (nome e cargo). Se apenas
    // uma das duas desse certo, sobraria um usuario quebrado no sistema.
    //
    // A solucao foi passar as duas gravacoes para uma funcao protegida dentro
    // do proprio banco de dados, chamada create_staff_user. O site so pede que
    // ela seja executada. Isso traz tres vantagens:
    //   1. As duas gravacoes viram uma operacao so, tudo ou nada.
    //   2. O site nunca manipula nem armazena a senha; quem faz isso e o banco.
    //   3. A funcao vive no esquema app_private, fechado para acesso externo.
    //
    // O nome $queryRaw significa "comando escrito a mao para o banco". Os
    // valores vao com ${...}, o que faz o banco trata-los como dados, e nunca
    // como comando. E assim que se evita o ataque conhecido como SQL Injection.
    const [usuario] = await prisma.$queryRaw<UsuarioResult[]>`
      SELECT * FROM app_private.create_staff_user(
        ${data.nome},
        ${data.email.toLowerCase()},
        ${data.senha},
        CAST(${data.perfil} AS "Perfil"),
        ${data.ativo}
      )
    `;

    // Conta nova nasce com o e-mail pendente: o painel so libera depois que a
    // pessoa clicar no link enviado agora.
    await enviarLinkConfirmacao(usuario.id, usuario.email);

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível criar o usuário agora." }, { status: 500 });
  }
}

// ===================== PARTE 3: ATUALIZAR USUARIO =====================
export async function PATCH(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // Mesma validacao da criacao, com uma diferenca: aqui o identificador do
    // usuario passa a ser obrigatorio. Afinal, e preciso saber quem editar.
    const data = usuarioAdminSchema.extend({ id: usuarioAdminSchema.shape.id.unwrap() }).parse(await request.json());

    // Chama a funcao protegida de atualizacao, irma da create_staff_user.
    // O detalhe do `data.senha || ""` importa: enviando texto vazio, a funcao
    // do banco entende "mantenha a senha atual". E assim que o administrador
    // corrige o nome ou o cargo de alguem sem trocar a senha da pessoa.
    // Guarda o e-mail atual para saber, depois, se ele foi trocado.
    const anterior = await prisma.usuario.findUnique({ where: { id: data.id }, select: { email: true } });

    const [usuario] = await prisma.$queryRaw<UsuarioResult[]>`
      SELECT * FROM app_private.update_staff_user(
        ${data.id},
        ${data.nome},
        ${data.email.toLowerCase()},
        ${data.senha || ""},
        CAST(${data.perfil} AS "Perfil"),
        ${data.ativo}
      )
    `;

    // E-mail trocado: a confirmacao antiga nao vale para o endereco novo.
    // O acesso fica bloqueado ate a pessoa confirmar o novo e-mail.
    if (anterior && anterior.email !== usuario.email) {
      await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificadoEm: null } });
      await enviarLinkConfirmacao(usuario.id, usuario.email);
    }

    return NextResponse.json(usuario);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível atualizar o usuário agora." }, { status: 500 });
  }
}

// ===================== PARTE 4: LINK DE CONFIRMACAO =====================
// Uma falha no envio do e-mail nunca desfaz o cadastro: a pessoa pode pedir
// um link novo na tela "confirme seu e-mail" depois de entrar.
async function enviarLinkConfirmacao(usuarioId: string, email: string) {
  try {
    await enviarVerificacao({ tipo: "USUARIO", usuarioId, email });
  } catch (error) {
    console.error("[verificacao-email] falha ao enviar link de usuario", error);
  }
}
