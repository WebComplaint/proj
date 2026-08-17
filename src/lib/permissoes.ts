import type { Perfil } from "@prisma/client";

export const adminPathPrefixes = [
  "/painel/usuarios",
  "/painel/categorias",
  "/painel/relatorios",
  "/api/painel/usuarios",
  "/api/painel/categorias",
  "/api/painel/relatorios"
];

export function isAdmin(perfil?: Perfil | null) {
  return perfil === "ADMIN";
}

export function isCoordenadorOuAdmin(perfil?: Perfil | null) {
  return perfil === "COORDENADOR" || perfil === "ADMIN";
}

export function exigeAdmin(pathname: string) {
  return adminPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
