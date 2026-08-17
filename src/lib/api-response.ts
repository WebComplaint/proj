import { ZodError } from "zod";

export type ApiError = {
  erro: string;
  campos?: Record<string, string>;
};

export function formatZodError(error: ZodError): ApiError {
  const campos: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");

    if (path && !campos[path]) {
      campos[path] = issue.message;
    }
  }

  return {
    erro: "Revise os campos destacados e tente novamente.",
    campos
  };
}
