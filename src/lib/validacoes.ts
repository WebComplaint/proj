/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o CONTROLE DE QUALIDADE de tudo que entra no sistema. Nada e gravado no
 * banco sem passar por estas regras.
 *
 * Cada bloco descreve o formato esperado de um tipo de dado. Por exemplo:
 *   - a descricao precisa ter pelo menos 20 caracteres;
 *   - no maximo 5 anexos, de ate 10 MB cada;
 *   - o protocolo precisa seguir exatamente o padrao DEN-AAAA-XXXXXX;
 *   - se a denuncia NAO for anonima, o e-mail passa a ser obrigatorio.
 *
 * As mensagens de erro estao escritas em portugues acolhedor de proposito.
 * Sao exatamente elas que aparecem na tela para quem esta denunciando.
 *
 * Para a apresentacao: e o filtro que protege o banco de dados sujo.
 */

import { z } from "zod";
import { categoriaSlugs } from "@/lib/categorias";

// BLOCO 1 - Regra do PROTOCOLO.
// Aquele trecho entre barras e uma "expressao regular", um molde de texto.
// Lendo em portugues, ele exige: a palavra DEN, um traco, exatamente 4 numeros
// (o ano), outro traco e 6 caracteres do alfabeto seguro.
// O .trim() apaga espacos sobrando, comuns quando a pessoa cola o codigo.
export const protocoloSchema = z.object({
  protocolo: z
    .string()
    .trim()
    .regex(/^DEN-\d{4}-[2-9A-HJKMNP-Z]{6}$/, "Informe um protocolo no formato DEN-AAAA-XXXXXX.")
});

// BLOCO 2 - Regra de cada ANEXO.
// Todo arquivo precisa ter endereco, nome, tipo e tamanho.
// O limite de 10 * 1024 * 1024 e exatamente 10 MB, escrito assim para deixar
// claro de onde vem a conta.
export const anexoSchema = z.object({
  arquivoUrl: z.string().min(1, "Envie o arquivo novamente."),
  nomeOriginal: z.string().min(1, "Informe o nome do arquivo."),
  tipoMime: z.string().min(1, "Informe o tipo do arquivo."),
  tamanho: z.number().int().positive("O arquivo precisa ter tamanho válido.").max(10 * 1024 * 1024)
});

// BLOCO 3 - Regra da DENUNCIA NOVA. E a validacao mais importante do sistema,
// porque e por ela que passa tudo que o publico envia.
// Campo a campo, do mais para o menos exigente:
//   categoriaSlug -> obrigatorio, e precisa ser uma das categorias conhecidas.
//   descricao     -> obrigatoria, minimo de 20 caracteres.
//   dataOcorrido  -> opcional (a pessoa pode nao lembrar a data).
//   local         -> opcional, ate 120 caracteres.
//   envolvidos    -> opcional, ate 4000 caracteres.
//   anexos        -> no maximo 5 arquivos.
//   anonima       -> obrigatorio escolher sim ou nao, sem valor automatico.
//   aceiteTermos  -> precisa ser exatamente verdadeiro para o envio acontecer.
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
  // BLOCO 4 - A REGRA QUE DEPENDE DE OUTRA RESPOSTA.
  // As regras acima olham um campo de cada vez. Esta olha a combinacao deles.
  // A pergunta que ela responde: o e-mail e obrigatorio? Depende.
  .superRefine((data, ctx) => {
    // Denuncia anonima: nao exige nada. A pessoa tem direito de nao se
    // identificar, e o sistema nao vai insistir.
    if (data.anonima) {
      return;
    }

    // Denuncia identificada sem e-mail: a pessoa disse que quer acompanhar,
    // mas nao deixou como ser avisada. Aqui o e-mail vira obrigatorio.
    if (!data.denuncianteEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["denuncianteEmail"],
        message: "Informe um e-mail para receber atualizações da denúncia identificada."
      });
    }
  });

// BLOCO 5 - Atalhos de tipo. Nao mudam nada em tempo de execucao; servem para
// o editor de codigo avisar o programador quando ele digita um campo errado.
export type CriarDenunciaInput = z.infer<typeof criarDenunciaSchema>;
export type ProtocoloInput = z.infer<typeof protocoloSchema>;

// BLOCO 6 - Regra dos FILTROS da lista do painel.
// Tudo aqui e opcional: a equipe combina os filtros que quiser.
// Os dois .default no fim sao os valores automaticos: sem escolha nenhuma, a
// lista vem ordenada por data, das mais recentes para as mais antigas.
//
// O z.preprocess remove os campos vazios antes da conferencia. O formulario
// de filtros envia TODOS os campos, e quem deixa "Todos" selecionado manda o
// campo em branco (status=). Sem isso, o texto vazio nao bate com nenhuma
// opcao da lista e a pagina inteira quebrava ao aplicar os filtros.
export const painelDenunciasQuerySchema = z.preprocess(
  (value) =>
    value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).filter(([, campo]) => campo !== "" && campo !== undefined))
      : value,
  z.object({
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
  })
);

// BLOCO 7 - Regra da ATUALIZACAO de uma denuncia pelo painel.
// Todos os campos sao opcionais de proposito: a equipe pode mudar so a
// prioridade, so o responsavel, ou os tres de uma vez.
// Repare no que NAO esta nesta lista: a descricao do relato. O texto original
// da pessoa nao pode ser alterado pela escola por nenhuma tela do sistema.
export const atualizarDenunciaSchema = z.object({
  status: z.enum(["RECEBIDA", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDA", "ARQUIVADA"]).optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  responsavelId: z.string().trim().nullable().optional(),
  comentario: z.string().trim().max(2000, "Use um comentário mais curto.").optional()
});

// BLOCO 8 - Regra do COMENTARIO no historico.
// O campo "publico" nao tem valor automatico. Isso e proposital: quem escreve
// e obrigado a declarar se a mensagem e interna ou vai para o denunciante.
// Um valor automatico aqui poderia expor uma nota da equipe por descuido.
export const criarComentarioSchema = z.object({
  comentario: z
    .string()
    .trim()
    .min(3, "Escreva um comentário para registrar no histórico.")
    .max(4000, "Use um comentário mais curto."),
  publico: z.boolean()
});

// BLOCO 9 - Regra do cadastro de USUARIO do painel.
// A senha exige no minimo 10 caracteres, acima dos 8 usados por costume.
// Ela tambem aceita ficar vazia (o .or com literal vazio): isso permite editar
// o nome ou o cargo de alguem sem obrigar a trocar a senha da pessoa.
export const usuarioAdminSchema = z.object({
  id: z.string().trim().optional(),
  nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120, "Use um nome mais curto."),
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(10, "Use uma senha com pelo menos 10 caracteres.").optional().or(z.literal("")),
  perfil: z.enum(["PROFESSOR", "COORDENADOR", "DIRETOR", "ADMIN"]),
  ativo: z.boolean().default(true)
});

// BLOCO 10 - Regra do cadastro de CATEGORIA.
// O destaque e o "slug": o apelido tecnico da categoria, como violencia_fisica.
// Ele so aceita letras minusculas, numeros e underline, sem acento e sem
// espaco. E esse apelido que aparece no endereco dos filtros do painel, e
// acento em endereco de internet costuma virar codigo estranho na tela.
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

// BLOCO 11 - Mais atalhos de tipo, como no bloco 5. Servem so para o editor.
export type PainelDenunciasQuery = z.infer<typeof painelDenunciasQuerySchema>;
export type AtualizarDenunciaInput = z.infer<typeof atualizarDenunciaSchema>;
export type CriarComentarioInput = z.infer<typeof criarComentarioSchema>;
export type UsuarioAdminInput = z.infer<typeof usuarioAdminSchema>;
export type CategoriaAdminInput = z.infer<typeof categoriaAdminSchema>;
