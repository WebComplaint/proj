import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { categoriaAdminSchema } from "@/lib/validacoes";

// ===================== PARTE 1: LISTAR CATEGORIAS =====================
export async function GET() {
  // Somente administrador.
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  // Ordena em tres niveis, nesta ordem: ativas primeiro, depois pela ordem
  // definida pela escola e, em caso de empate, por nome em ordem alfabetica.
  const categorias = await prisma.categoria.findMany({
    orderBy: [{ ativa: "desc" }, { ordem: "asc" }, { nome: "asc" }]
  });

  return NextResponse.json({ categorias });
}

// ===================== PARTE 2: CRIAR CATEGORIA =====================
export async function POST(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // Confere nome, apelido tecnico (slug), prioridade padrao e ordem.
    const data = categoriaAdminSchema.parse(await request.json());

    // Grava a categoria nova. Ela aparece no formulario publico na hora.
    // O `|| null` transforma texto vazio em "nao informado", para o banco nao
    // guardar campos com vazio em vez de ausencia de valor.
    const categoria = await prisma.categoria.create({
      data: {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao || null,
        icone: data.icone || null,
        prioridadePadrao: data.prioridadePadrao,
        ativa: data.ativa,
        ordem: data.ordem
      }
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível criar a categoria agora." }, { status: 500 });
  }
}

// ===================== PARTE 3: ATUALIZAR CATEGORIA =====================
export async function PATCH(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    // Como na criacao, mas agora exigindo o identificador da categoria.
    const data = categoriaAdminSchema.extend({ id: categoriaAdminSchema.shape.id.unwrap() }).parse(await request.json());

    // Atualiza a categoria. Note que nao existe rota para EXCLUIR: para tirar
    // uma categoria de circulacao, a escola marca "ativa" como falso.
    // Excluir de verdade quebraria as denuncias antigas ligadas a ela, que
    // ficariam sem categoria nenhuma no historico.
    const categoria = await prisma.categoria.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao || null,
        icone: data.icone || null,
        prioridadePadrao: data.prioridadePadrao,
        ativa: data.ativa,
        ordem: data.ordem
      }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json({ erro: "Não foi possível atualizar a categoria agora." }, { status: 500 });
  }
}
