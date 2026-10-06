/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Guarda a lista das 8 categorias de denuncia com nome, descricao, icone e
 * prioridade inicial de cada uma.
 *
 * Repare no campo "prioridadePadrao": categorias mais graves, como Assedio
 * e Violencia fisica, ja nascem com prioridade ALTA. Assim a equipe da
 * escola percebe o caso urgente sem precisar ler tudo primeiro.
 *
 * Para a apresentacao: e a lista de opcoes que aparece no formulario.
 */

import type { Prioridade } from "@prisma/client";

// BLOCO 1 - O formato de uma categoria. Cada campo tem um papel:
//   slug             -> o apelido tecnico, sem acento (usado nos enderecos).
//   nome             -> o que a pessoa le na tela.
//   descricao        -> a explicacao curta dentro do cartao.
//   icone            -> a letra mostrada no cartao.
//   prioridadePadrao -> a urgencia com que o caso ja nasce.
//   ordem            -> a posicao do cartao no formulario.
export type CategoriaInicial = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  prioridadePadrao: Prioridade;
  ordem: number;
};

// BLOCO 2 - As 8 categorias que o sistema ja traz de fabrica.
// Vale reparar na coluna prioridadePadrao ao longo da lista: Assedio, Abuso e
// Violencia fisica nascem com prioridade ALTA; as demais nascem com MEDIA.
// Isso significa que uma denuncia grave ja chega destacada no painel, antes
// mesmo de alguem da escola ler o relato.
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

// BLOCO 3 - Extrai so os apelidos tecnicos da lista acima.
// Essa lista curta e entregue as validacoes, que passam a recusar qualquer
// categoria que nao esteja aqui. Assim ninguem consegue enviar uma denuncia
// com uma categoria inventada, mesmo alterando o formulario por fora do site.
export const categoriaSlugs = categoriasIniciais.map((categoria) => categoria.slug) as [
  string,
  ...string[]
];
