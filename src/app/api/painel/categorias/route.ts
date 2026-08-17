import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/server-auth";
import { categoriaAdminSchema } from "@/lib/validacoes";

export async function GET() {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  const categorias = await prisma.categoria.findMany({
    orderBy: [{ ativa: "desc" }, { ordem: "asc" }, { nome: "asc" }]
  });

  return NextResponse.json({ categorias });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = categoriaAdminSchema.parse(await request.json());
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

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const data = categoriaAdminSchema.extend({ id: categoriaAdminSchema.shape.id.unwrap() }).parse(await request.json());
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
