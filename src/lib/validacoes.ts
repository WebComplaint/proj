import { z } from "zod";
import { categoriaSlugs } from "@/lib/categorias";

export const protocoloSchema = z.object({
  protocolo: z
    .string()
    .trim()
    .regex(/^DEN-\d{4}-[2-9A-HJKMNP-Z]{6}$/, "Informe um protocolo no formato DEN-AAAA-XXXXXX.")
});

export const anexoSchema = z.object({
  arquivoUrl: z.string().min(1, "Envie o arquivo novamente."),
  nomeOriginal: z.string().min(1, "Informe o nome do arquivo."),
  tipoMime: z.string().min(1, "Informe o tipo do arquivo."),
  tamanho: z.number().int().positive("O arquivo precisa ter tamanho válido.").max(10 * 1024 * 1024)
});

export const criarDenunciaSchema = z
  .object({
    categoriaSlug: z.enum(categoriaSlugs, {
      errorMap: () => ({ message: "Escolha uma categoria para continuar." })
    }),
    descricao: z
      .string({
        required_error: "Descreva o que aconteceu para enviar a denúncia."
      })
      .trim()
      .min(20, "Conte um pouco mais sobre o que aconteceu, com pelo menos 20 caracteres."),
    dataOcorrido: z.string().datetime().optional().nullable(),
    local: z.string().trim().max(120, "Use um local mais curto.").optional().nullable(),
    envolvidos: z.string().trim().max(4000, "O texto de envolvidos está muito longo.").optional().nullable(),
    anexos: z.array(anexoSchema).max(5, "Envie no máximo 5 arquivos.").default([]),
    anonima: z.boolean({
      required_error: "Escolha se deseja denunciar anonimamente ou se identificar."
    }),
    denuncianteNome: z.string().trim().max(120, "Use um nome mais curto.").optional().nullable(),
    denuncianteEmail: z.string().trim().email("Informe um e-mail válido para receber atualizações.").optional().nullable(),
    denuncianteTelefone: z.string().trim().max(30, "Use um telefone mais curto.").optional().nullable(),
    aceiteTermos: z.literal(true, {
      errorMap: () => ({ message: "Aceite o termo de consentimento e a política de privacidade para enviar." })
    })
  })
  .superRefine((data, ctx) => {
    if (data.anonima) {
      return;
    }

    if (!data.denuncianteEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["denuncianteEmail"],
        message: "Informe um e-mail para receber atualizações da denúncia identificada."
      });
    }
  });

export type CriarDenunciaInput = z.infer<typeof criarDenunciaSchema>;
export type ProtocoloInput = z.infer<typeof protocoloSchema>;

export const painelDenunciasQuerySchema = z.object({
  status: z.enum(["RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ARQUIVADA"]).optional(),
  categoria: z.string().trim().optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  tipo: z.enum(["anonima", "identificada"]).optional(),
  responsavelId: z.string().trim().optional(),
  protocolo: z.string().trim().optional(),
  inicio: z.string().trim().optional(),
  fim: z.string().trim().optional(),
  ordenarPor: z.enum(["data", "prioridade"]).default("data"),
  direcao: z.enum(["asc", "desc"]).default("desc"),
  pagina: z.coerce.number().int().positive().default(1)
});

export const atualizarDenunciaSchema = z.object({
  status: z.enum(["RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ARQUIVADA"]).optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  responsavelId: z.string().trim().nullable().optional(),
  comentario: z.string().trim().max(2000, "Use um comentário mais curto.").optional()
});

export const criarComentarioSchema = z.object({
  comentario: z
    .string()
    .trim()
    .min(3, "Escreva um comentário para registrar no histórico.")
    .max(4000, "Use um comentário mais curto."),
  publico: z.boolean()
});

export const usuarioAdminSchema = z.object({
  id: z.string().trim().optional(),
  nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120, "Use um nome mais curto."),
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(10, "Use uma senha com pelo menos 10 caracteres.").optional().or(z.literal("")),
  perfil: z.enum(["COORDENADOR", "ADMIN"]),
  ativo: z.boolean().default(true)
});

export const categoriaAdminSchema = z.object({
  id: z.string().trim().optional(),
  nome: z.string().trim().min(2, "Informe o nome da categoria.").max(80, "Use um nome mais curto."),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug da categoria.")
    .max(80, "Use um slug mais curto.")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e underline."),
  descricao: z.string().trim().max(2000, "Use uma descrição mais curta.").optional().nullable(),
  icone: z.string().trim().max(4, "Use um ícone curto.").optional().nullable(),
  prioridadePadrao: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  ativa: z.boolean().default(true),
  ordem: z.coerce.number().int().min(0, "Use uma ordem igual ou maior que zero.").default(0)
});

export type PainelDenunciasQuery = z.infer<typeof painelDenunciasQuerySchema>;
export type AtualizarDenunciaInput = z.infer<typeof atualizarDenunciaSchema>;
export type CriarComentarioInput = z.infer<typeof criarComentarioSchema>;
export type UsuarioAdminInput = z.infer<typeof usuarioAdminSchema>;
export type CategoriaAdminInput = z.infer<typeof categoriaAdminSchema>;
