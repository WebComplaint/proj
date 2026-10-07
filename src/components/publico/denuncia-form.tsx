"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o FORMULARIO DE DENUNCIA em 4 etapas, o componente mais importante da
 * parte publica do sistema.
 *
 * As 4 etapas:
 *   1. Relato   -> categoria e descricao (as unicas obrigatorias).
 *   2. Detalhes -> data, local e envolvidos (tudo opcional).
 *   3. Provas   -> ate 5 arquivos de 10 MB (opcional).
 *   4. Envio    -> anonima ou identificada, e o aceite dos termos.
 *
 * Por que dividir em etapas? Uma tela unica com 10 campos assusta quem ja
 * esta nervoso para denunciar. Perguntas curtas, uma de cada vez, reduzem
 * a desistencia no meio do caminho.
 *
 * Duas decisoes que valem citar na apresentacao:
 *
 *   - Os campos de nome, e-mail e telefone so aparecem na tela DEPOIS que a
 *     pessoa escolhe se identificar. Na opcao anonima eles nao existem.
 *
 *   - A conferencia dos campos e feita duas vezes: aqui, para avisar rapido
 *     sem recarregar a pagina, e de novo no servidor. A daqui e conforto;
 *     a do servidor e a que realmente protege, porque qualquer pessoa pode
 *     burlar o que roda no proprio navegador.
 *
 * No fim, o protocolo recebido e guardado na memoria temporaria da aba
 * (sessionStorage) para ser exibido na tela seguinte, e some quando a aba
 * e fechada.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CategoriaCard,
  CategoriaIcone,
  FileDropzone,
  NeuButton,
  NeuCard,
  NeuCheckbox,
  NeuInput,
  NeuTextarea,
  StepIndicator
} from "@/components/ui";
import { categoriasIniciais } from "@/lib/categorias";

// BLOCO 1 - O formato de um arquivo que ja foi enviado com sucesso.
type UploadedFile = {
  arquivoUrl: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
};

// BLOCO 2 - Tudo que o formulario guarda enquanto a pessoa preenche.
// E a "ficha em branco" que vai sendo completada etapa por etapa.
type FormState = {
  categoriaSlug: string;
  descricao: string;
  dataOcorrido: string;
  local: string;
  envolvidos: string;
  anexos: UploadedFile[];
  anonima: boolean;
  denuncianteNome: string;
  denuncianteEmail: string;
  denuncianteTelefone: string;
  aceiteTermos: boolean;
};

// BLOCO 3 - Como o formulario comeca, com tudo vazio.
// Repare em "anonima: true". A opcao ja vem marcada como ANONIMA.
// Isso e uma decisao de privacidade: se a pessoa nao mexer em nada, ela fica
// protegida. O padrao mais seguro e o que exige menos esforco dela.
const initialState: FormState = {
  categoriaSlug: "",
  descricao: "",
  dataOcorrido: "",
  local: "",
  envolvidos: "",
  anexos: [],
  anonima: true,
  denuncianteNome: "",
  denuncianteEmail: "",
  denuncianteTelefone: "",
  aceiteTermos: false
};

// BLOCO 4 - Os limites de anexo, repetidos aqui de proposito.
// Eles ja existem no servidor. Aqui servem so para avisar a pessoa na hora,
// antes de gastar tempo e dados enviando um arquivo que seria recusado.
// Quem vale de verdade e sempre a conferencia do servidor.
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];

export function DenunciaForm() {
  // BLOCO 5 - A MEMORIA DO FORMULARIO.
  // Cada linha guarda uma informacao que muda enquanto a pessoa usa a tela.
  // Quando qualquer uma delas muda, a tela se redesenha sozinha.
  const router = useRouter();                                              // leva para outra pagina no fim
  const [step, setStep] = useState(0);                                     // etapa atual (0 a 3)
  const [form, setForm] = useState<FormState>(initialState);               // o que ja foi preenchido
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // erros por campo
  const [formError, setFormError] = useState("");                          // erro geral do topo
  const [uploading, setUploading] = useState(false);                       // esta enviando anexo?
  const [submitting, setSubmitting] = useState(false);                     // esta enviando a denuncia?

  // Conta os caracteres do relato para mostrar "35/20 caracteres minimos".
  const descriptionCount = form.descricao.trim().length;

  // BLOCO 6 - Calcula a situacao de cada bolinha da trilha de etapas:
  // concluida (completed), atual (current) ou ainda por vir (pending).
  const steps = useMemo(
    () => [
      { label: "Relato", state: step > 0 ? "completed" : step === 0 ? "current" : "pending" },
      { label: "Detalhes", state: step > 1 ? "completed" : step === 1 ? "current" : "pending" },
      { label: "Provas", state: step > 2 ? "completed" : step === 2 ? "current" : "pending" },
      { label: "Envio", state: step === 3 ? "current" : "pending" }
    ] as Array<{ label: string; state: "completed" | "current" | "pending" }>,
    [step]
  );

  // BLOCO 7 - Guarda o que a pessoa acabou de digitar em um campo.
  // Faz duas coisas: atualiza o valor e APAGA o erro daquele campo.
  // Assim a mensagem em vermelho some assim que a pessoa comeca a corrigir,
  // em vez de ficar la acusando enquanto ela ja esta consertando.
  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  // BLOCO 8 - Confere apenas os campos da etapa em que a pessoa esta.
  // Cobrar tudo de uma vez seria injusto: ela nem viu as outras etapas ainda.
  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    // Etapa 1 (Relato): categoria escolhida e descricao com 20 caracteres.
    if (step === 0) {
      if (!form.categoriaSlug) {
        errors.categoriaSlug = "Escolha uma categoria para continuar.";
      }

      if (descriptionCount < 20) {
        errors.descricao = "Conte um pouco mais sobre o que aconteceu, com pelo menos 20 caracteres.";
      }
    }

    // Etapa 4 (Envio): o e-mail so e cobrado de quem escolheu se identificar,
    // e o aceite dos termos e sempre obrigatorio.
    // As etapas 2 e 3 nao aparecem aqui porque sao inteiramente opcionais.
    if (step === 3) {
      if (!form.anonima && !form.denuncianteEmail.trim()) {
        errors.denuncianteEmail = "Informe um e-mail para receber atualizações da denúncia identificada.";
      }

      if (!form.aceiteTermos) {
        errors.aceiteTermos = "Aceite o termo de consentimento e a política de privacidade para enviar.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // BLOCO 9 - Botao "Continuar": so avanca se a etapa atual estiver correta.
  // O Math.min impede passar da ultima etapa.
  function goNext() {
    setFormError("");

    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  // BLOCO 10 - Botao "Voltar". Limpa os erros antes de voltar, porque nao faz
  // sentido cobrar de uma etapa que a pessoa esta deixando para tras.
  // Importante: voltar NAO apaga o que ja foi preenchido.
  function goBack() {
    setFormError("");
    setFieldErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  // BLOCO 11 - ENVIO DOS ANEXOS.
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setFormError("");
    const selectedFiles = Array.from(files);

    // Confere o total: os que ja estao mais os que acabaram de ser escolhidos.
    // Sem essa soma, seria possivel passar dos 5 enviando de dois em dois.
    if (form.anexos.length + selectedFiles.length > MAX_FILES) {
      setFormError("Envie no máximo 5 arquivos. Remova um anexo antes de adicionar outro.");
      return;
    }

    setUploading(true);

    try {
      const uploaded: UploadedFile[] = [];

      // Envia um arquivo de cada vez. Cada um passa pelas mesmas conferencias
      // de formato e tamanho antes de sair do navegador.
      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

        if (!allowedExtensions.includes(extension)) {
          throw new Error("Formato não permitido. Envie jpg, jpeg, png, webp ou pdf.");
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error("O arquivo passa de 10 MB. Escolha um menor ou reduza a qualidade da imagem.");
        }

        // Empacota o arquivo e manda para a rota /api/upload, que salva e
        // devolve o endereco onde ele ficou guardado.
        const body = new FormData();
        body.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.erro ?? "Não foi possível enviar o arquivo.");
        }

        uploaded.push(result);
      }

      updateField("anexos", [...form.anexos, ...uploaded]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
    } finally {
      // O "finally" roda sempre, com erro ou sem erro. Isso garante que o
      // aviso de "Enviando arquivo" sempre desapareca da tela.
      setUploading(false);
    }
  }

  // BLOCO 12 - Botao "Remover arquivo". Monta a lista de novo sem o arquivo
  // escolhido, comparando pelo endereco dele.
  function removeFile(url: string) {
    updateField(
      "anexos",
      form.anexos.filter((file) => file.arquivoUrl !== url)
    );
  }

  // BLOCO 13 - O ENVIO FINAL DA DENUNCIA.
  async function submitDenuncia() {
    setFormError("");

    // Duas travas antes de enviar:
    //   1. a ultima etapa precisa estar valida;
    //   2. "submitting" impede o clique duplo. Sem isso, dois cliques rapidos
    //      cadastrariam a mesma denuncia duas vezes, com protocolos diferentes.
    if (!validateCurrentStep() || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      // Monta o pacote e envia para a rota que grava a denuncia.
      const response = await fetch("/api/denuncias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          categoriaSlug: form.categoriaSlug,
          descricao: form.descricao,
          dataOcorrido: form.dataOcorrido ? new Date(form.dataOcorrido).toISOString() : null,
          local: form.local || null,
          envolvidos: form.envolvidos || null,
          anexos: form.anexos,
          anonima: form.anonima,

          // A REGRA DO ANONIMATO, aplicada tambem aqui.
          // Leia: "se for anonima, mande vazio; senao, mande o valor".
          // Sendo anonima, os dados pessoais nem saem do navegador da pessoa.
          // O servidor repete essa mesma regra na hora de gravar, entao a
          // protecao existe nas duas pontas.
          denuncianteNome: form.anonima ? null : form.denuncianteNome || null,
          denuncianteEmail: form.anonima ? null : form.denuncianteEmail || null,
          denuncianteTelefone: form.anonima ? null : form.denuncianteTelefone || null,
          aceiteTermos: form.aceiteTermos
        })
      });
      const result = await response.json();

      // O servidor recusou: aproveita a lista de campos com problema que ele
      // devolveu e marca cada um em vermelho na tela.
      // Nem todo campo tem um lugar para mostrar o erro (os anexos, por
      // exemplo). Por isso as mensagens dos campos tambem vao para o aviso do
      // topo: a pessoa sempre fica sabendo o que precisa corrigir.
      if (!response.ok) {
        const campos: Record<string, string> = result.campos ?? {};
        const motivos = Array.from(new Set(Object.values(campos)));

        setFieldErrors(campos);
        throw new Error(
          [result.erro ?? "Não foi possível enviar a denúncia agora.", ...motivos].join(" ")
        );
      }

      // DEU CERTO. Guarda o protocolo na memoria temporaria da aba e leva a
      // pessoa para a tela de confirmacao, que vai exibi-lo.
      // Essa memoria (sessionStorage) e apagada quando a aba fecha, e serve
      // so para atravessar de uma tela para a outra.
      sessionStorage.setItem("ultimoProtocoloDenuncia", result.protocolo);
      if (result.verificacaoEnviada) sessionStorage.setItem("ultimaDenunciaVerificacaoEnviada", "1");
      router.push("/denunciar/enviada");
    } catch (error) {
      // Deu errado: mostra o aviso e LIBERA o botao para nova tentativa.
      setFormError(error instanceof Error ? error.message : "Não foi possível enviar a denúncia agora.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6" aria-busy={submitting || uploading || undefined}>
      {/* BLOCO 14 - A TELA. A trilha de etapas fica sempre visivel no topo. */}
      <StepIndicator steps={steps} />

      {/* Aviso geral de erro, quando existe algum. */}
      {formError && (
        <div className="rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          {formError}
        </div>
      )}

      <NeuCard>
        {/* ETAPA 1 - RELATO. Aparece apenas quando step vale 0.
            E a unica etapa com campos obrigatorios: categoria e descricao. */}
        {step === 0 && (
          <section className="grid gap-6">
            <div>
              <h2 className="text-2xl font-bold">O que aconteceu</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Escolha a categoria mais próxima e conte o que você lembra.
              </p>
            </div>
            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold text-text-secondary">Categoria</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {categoriasIniciais.map((categoria) => (
                  <CategoriaCard
                    key={categoria.slug}
                    icon={<CategoriaIcone slug={categoria.slug} />}
                    title={categoria.nome}
                    description={categoria.descricao}
                    selected={form.categoriaSlug === categoria.slug}
                    onClick={() => updateField("categoriaSlug", categoria.slug)}
                  />
                ))}
              </div>
              {fieldErrors.categoriaSlug && <p className="text-sm text-danger-600">{fieldErrors.categoriaSlug}</p>}
            </fieldset>
            <div className="grid gap-2">
              <NeuTextarea
                label="Descrição"
                name="descricao"
                placeholder="Conte do seu jeito. Pode ser curto, mas tente explicar o que aconteceu."
                value={form.descricao}
                onChange={(event) => updateField("descricao", event.target.value)}
                error={fieldErrors.descricao}
              />
              <p className="text-right text-sm text-text-secondary">{descriptionCount}/20 caracteres mínimos</p>
            </div>
          </section>
        )}

        {/* ETAPA 2 - DETALHES. Data, local e envolvidos, tudo opcional.
            Ninguem e obrigado a lembrar de tudo para poder denunciar. */}
        {step === 1 && (
          <section className="grid gap-6">
            <div>
              <h2 className="text-2xl font-bold">Detalhes</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Tudo nesta etapa é opcional. Preencha apenas o que souber.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <NeuInput
                label="Data e horário aproximados"
                name="dataOcorrido"
                type="datetime-local"
                value={form.dataOcorrido}
                onChange={(event) => updateField("dataOcorrido", event.target.value)}
              />
              <NeuInput
                label="Local"
                name="local"
                placeholder="Sala, pátio, online..."
                value={form.local}
                onChange={(event) => updateField("local", event.target.value)}
              />
              <div className="sm:col-span-2">
                <NeuTextarea
                  label="Pessoas envolvidas"
                  name="envolvidos"
                  placeholder="Nomes, turmas ou descrições, se você souber."
                  value={form.envolvidos}
                  onChange={(event) => updateField("envolvidos", event.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* ETAPA 3 - PROVAS. Ate 5 arquivos de 10 MB, tambem opcional. */}
        {step === 2 && (
          <section className="grid gap-6">
            <div>
              <h2 className="text-2xl font-bold">Provas</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Opcional. Você pode anexar até 5 arquivos, com 10 MB cada.
              </p>
            </div>
            <FileDropzone
              label={uploading ? "Enviando arquivo" : "Anexos"}
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              disabled={uploading}
              onChange={(event) => uploadFiles(event.target.files)}
            />
            {form.anexos.length > 0 && (
              <ul className="grid gap-3">
                {form.anexos.map((file) => (
                  <li key={file.arquivoUrl} className="surface-neuro-sm flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{file.nomeOriginal}</p>
                      <p className="text-sm text-text-secondary">{formatFileSize(file.tamanho)}</p>
                    </div>
                    <NeuButton variant="ghost" size="sm" onClick={() => removeFile(file.arquivoUrl)}>
                      Remover arquivo
                    </NeuButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ETAPA 4 - IDENTIFICACAO E ENVIO. A etapa mais delicada do sistema. */}
        {step === 3 && (
          <section className="grid gap-6">
            <div>
              <h2 className="text-2xl font-bold">Identificação e envio</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Escolha como a denúncia será registrada antes de enviar.
              </p>
            </div>
            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold text-text-secondary">Identificação</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={`rounded-calm border bg-base p-5 text-left transition-[box-shadow,border-color] duration-200 ease-calm ${
                    form.anonima ? "border-turquoise-500 shadow-neuro-inset" : "border-ocean-600/15 shadow-neuro-sm"
                  }`}
                  type="button"
                  aria-pressed={form.anonima}
                  onClick={() => updateField("anonima", true)}
                >
                  <span className="block text-lg font-bold">Denunciar anonimamente</span>
                  <span className="mt-2 block text-sm leading-6 text-text-secondary">
                    Nenhum campo pessoal será exibido ou enviado.
                  </span>
                </button>
                <button
                  className={`rounded-calm border bg-base p-5 text-left transition-[box-shadow,border-color] duration-200 ease-calm ${
                    !form.anonima ? "border-turquoise-500 shadow-neuro-inset" : "border-ocean-600/15 shadow-neuro-sm"
                  }`}
                  type="button"
                  aria-pressed={!form.anonima}
                  onClick={() => updateField("anonima", false)}
                >
                  <span className="block text-lg font-bold">Me identificar</span>
                  <span className="mt-2 block text-sm leading-6 text-text-secondary">
                    Use esta opção se puder receber atualizações por e-mail.
                  </span>
                </button>
              </div>
            </fieldset>

            {/* OS CAMPOS PESSOAIS SO EXISTEM AQUI DENTRO.
                Leia a condicao: "se NAO for anonima, mostre este bloco".
                Na opcao anonima, nome, e-mail e telefone nem chegam a ser
                desenhados na tela. Nao estao escondidos: nao existem.
                Este e um bom trecho para mostrar na apresentacao. */}
            {!form.anonima && (
              <div className="grid gap-5 sm:grid-cols-2">
                <NeuInput
                  label="Nome"
                  name="denuncianteNome"
                  placeholder="Seu nome"
                  value={form.denuncianteNome}
                  onChange={(event) => updateField("denuncianteNome", event.target.value)}
                />
                <NeuInput
                  label="E-mail"
                  name="denuncianteEmail"
                  type="email"
                  placeholder="voce@escola.com"
                  value={form.denuncianteEmail}
                  onChange={(event) => updateField("denuncianteEmail", event.target.value)}
                  error={fieldErrors.denuncianteEmail}
                />
                <div className="sm:col-span-2">
                  <NeuInput
                    label="Telefone"
                    name="denuncianteTelefone"
                    placeholder="Opcional"
                    value={form.denuncianteTelefone}
                    onChange={(event) => updateField("denuncianteTelefone", event.target.value)}
                  />
                </div>
              </div>
            )}

            <NeuCheckbox
              name="aceiteTermos"
              label="Aceito o termo de consentimento e a política de privacidade"
              description="O envio só acontece depois deste aceite."
              checked={form.aceiteTermos}
              onChange={(event) => updateField("aceiteTermos", event.target.checked)}
              error={fieldErrors.aceiteTermos}
            />
          </section>
        )}
      </NeuCard>

      {/* BLOCO 15 - A NAVEGACAO ENTRE AS ETAPAS.
          Nas tres primeiras aparece "Continuar"; na ultima, "Enviar denuncia".
          Trocar o texto do botao deixa claro que aquele clique e o definitivo. */}
      <div className="grid gap-3 sm:flex sm:justify-between">
        <NeuButton variant="ghost" onClick={goBack} disabled={step === 0 || submitting}>
          Voltar
        </NeuButton>
        {step < 3 ? (
          <NeuButton className="w-full sm:w-auto" size="lg" onClick={goNext}>
            Continuar
          </NeuButton>
        ) : (
          <NeuButton className="w-full sm:w-auto" size="lg" loading={submitting} onClick={submitDenuncia}>
            Enviar denúncia
          </NeuButton>
        )}
      </div>
    </div>
  );
}

// BLOCO 16 - Mostra o tamanho do arquivo em KB ou MB, para a pessoa conferir
// o que anexou sem precisar entender a contagem em bytes do computador.
function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
