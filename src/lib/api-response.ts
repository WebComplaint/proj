/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Traduz erros tecnicos de validacao para uma resposta organizada, dizendo
 * exatamente QUAL campo esta errado e POR QUE.
 *
 * Sem isso o usuario veria algo como "ZodError: invalid_string". Com isso,
 * ele ve "Informe um e-mail valido" bem embaixo do campo de e-mail.
 *
 * Para a apresentacao: e o tradutor de erro tecnico para portugues claro.
 */

import { ZodError } from "zod";

// BLOCO 1 - O formato padrao de erro do sistema.
// "erro" e a frase geral mostrada no topo da tela.
// "campos" e uma lista opcional dizendo qual campo errou e qual a mensagem dele.
// Exemplo: { erro: "Revise os campos", campos: { descricao: "Muito curta." } }
export type ApiError = {
  erro: string;
  campos?: Record<string, string>;
};

// BLOCO 2 - Traduz o erro tecnico da validacao para esse formato padrao.
export function formatZodError(error: ZodError): ApiError {
  const campos: Record<string, string> = {};

  // Percorre cada problema encontrado na conferencia dos dados.
  for (const issue of error.issues) {
    // "path" e o nome do campo com problema (por exemplo: denuncianteEmail).
    const path = issue.path.join(".");

    // Guarda apenas a PRIMEIRA mensagem de cada campo.
    // Se um campo tem tres erros, mostrar os tres so confunde quem esta lendo.
    if (path && !campos[path]) {
      campos[path] = issue.message;
    }
  }

  // Devolve a frase geral mais a lista de campos com problema.
  return {
    erro: "Revise os campos destacados e tente novamente.",
    campos
  };
}
