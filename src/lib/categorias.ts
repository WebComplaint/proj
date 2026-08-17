import type { Prioridade } from "@prisma/client";

export type CategoriaInicial = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  prioridadePadrao: Prioridade;
  ordem: number;
};

export const categoriasIniciais: CategoriaInicial[] = [
  {
    slug: "bullying",
    nome: "Bullying",
    descricao: "Ameaças, humilhações, intimidação ou exclusão repetida.",
    icone: "B",
    prioridadePadrao: "MEDIA",
    ordem: 1
  },
  {
    slug: "cyberbullying",
    nome: "Cyberbullying",
    descricao: "Agressões, exposição ou intimidação em ambientes digitais.",
    icone: "C",
    prioridadePadrao: "MEDIA",
    ordem: 2
  },
  {
    slug: "assedio",
    nome: "Assédio",
    descricao: "Conduta invasiva, constrangedora ou insistente.",
    icone: "A",
    prioridadePadrao: "ALTA",
    ordem: 3
  },
  {
    slug: "abuso",
    nome: "Abuso",
    descricao: "Situação de abuso ou violação grave de segurança.",
    icone: "S",
    prioridadePadrao: "ALTA",
    ordem: 4
  },
  {
    slug: "discriminacao",
    nome: "Discriminação",
    descricao: "Tratamento ofensivo ou injusto por identidade, origem, crença ou condição.",
    icone: "D",
    prioridadePadrao: "MEDIA",
    ordem: 5
  },
  {
    slug: "violencia_fisica",
    nome: "Violência física",
    descricao: "Agressão, ameaça corporal ou briga com risco físico.",
    icone: "V",
    prioridadePadrao: "ALTA",
    ordem: 6
  },
  {
    slug: "ameaca",
    nome: "Ameaça",
    descricao: "Mensagem, gesto ou atitude que indique risco ou intimidação.",
    icone: "M",
    prioridadePadrao: "MEDIA",
    ordem: 7
  },
  {
    slug: "outros",
    nome: "Outros",
    descricao: "Outra situação que precisa ser acolhida pela escola.",
    icone: "O",
    prioridadePadrao: "MEDIA",
    ordem: 8
  }
];

export const categoriaSlugs = categoriasIniciais.map((categoria) => categoria.slug) as [
  string,
  ...string[]
];
