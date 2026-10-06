/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Define QUEM pode fazer O QUE dentro do painel.
 *
 * Existem 4 perfis: Professor, Coordenador, Diretor e Administrador.
 *   - Todos os quatro veem e tratam denuncias.
 *   - Somente o Administrador entra nas areas de cadastro de usuarios,
 *     categorias e relatorios.
 *
 * A lista adminPathPrefixes e a relacao das areas restritas. O porteiro
 * (middleware.ts) consulta essa lista a cada acesso.
 *
 * Para a apresentacao: e o controle de acesso por cargo.
 */

import type { Perfil } from "@prisma/client";

// BLOCO 1 - A lista das areas restritas ao administrador.
// As tres primeiras sao TELAS que a pessoa abre no navegador.
// As tres ultimas, comecadas por /api, sao as PORTAS DE DADOS por tras delas.
// As duas precisam estar protegidas. Proteger so a tela seria como trancar a
// porta da sala e deixar a janela aberta: bastaria chamar o endereco /api
// direto para conseguir os mesmos dados.
export const adminPathPrefixes = [
  "/painel/usuarios",
  "/painel/categorias",
  "/painel/relatorios",
  "/api/painel/usuarios",
  "/api/painel/categorias",
  "/api/painel/relatorios"
];

// BLOCO 2 - Esta pessoa e administradora?
export function isAdmin(perfil?: Perfil | null) {
  return perfil === "ADMIN";
}

// BLOCO 3 - Esta pessoa faz parte da equipe da escola?
// Os quatro perfis podem ver e tratar denuncias. O que muda entre eles e o
// acesso as areas de administracao, checado pela funcao acima.
export function isCoordenadorOuAdmin(perfil?: Perfil | null) {
  return perfil === "PROFESSOR" || perfil === "COORDENADOR" || perfil === "DIRETOR" || perfil === "ADMIN";
}

// BLOCO 4 - O endereco que a pessoa tentou abrir e area de administrador?
// Compara o endereco com a lista do bloco 1. O startsWith cobre as subpaginas:
// /painel/usuarios/123 tambem e protegido, e nao apenas /painel/usuarios.
export function exigeAdmin(pathname: string) {
  return adminPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
