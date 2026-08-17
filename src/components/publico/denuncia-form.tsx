"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CategoriaCard,
  FileDropzone,
  NeuButton,
  NeuCard,
  NeuCheckbox,
  NeuInput,
  NeuTextarea,
  StepIndicator
} from "@/components/ui";
import { categoriasIniciais } from "@/lib/categorias";

type UploadedFile = {
  arquivoUrl: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
};

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

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];

export function DenunciaForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const descriptionCount = form.descricao.trim().length;
  const steps = useMemo(
    () => [
      { label: "Relato", state: step > 0 ? "completed" : step === 0 ? "current" : "pending" },
      { label: "Detalhes", state: step > 1 ? "completed" : step === 1 ? "current" : "pending" },
      { label: "Provas", state: step > 2 ? "completed" : step === 2 ? "current" : "pending" },
      { label: "Envio", state: step === 3 ? "current" : "pending" }
    ] as Array<{ label: string; state: "completed" | "current" | "pending" }>,
    [step]
  );

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!form.categoriaSlug) {
        errors.categoriaSlug = "Escolha uma categoria para continuar.";
      }

      if (descriptionCount < 20) {
        errors.descricao = "Conte um pouco mais sobre o que aconteceu, com pelo menos 20 caracteres.";
      }
    }

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

  function goNext() {
    setFormError("");

    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  function goBack() {
    setFormError("");
    setFieldErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setFormError("");
    const selectedFiles = Array.from(files);

    if (form.anexos.length + selectedFiles.length > MAX_FILES) {
      setFormError("Envie no máximo 5 arquivos. Remova um anexo antes de adicionar outro.");
      return;
    }

    setUploading(true);

    try {
      const uploaded: UploadedFile[] = [];

      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

        if (!allowedExtensions.includes(extension)) {
          throw new Error("Formato não permitido. Envie jpg, jpeg, png, webp ou pdf.");
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error("O arquivo passa de 10 MB. Escolha um menor ou reduza a qualidade da imagem.");
        }

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
      setUploading(false);
    }
  }

  function removeFile(url: string) {
    updateField(
      "anexos",
      form.anexos.filter((file) => file.arquivoUrl !== url)
    );
  }

  async function submitDenuncia() {
    setFormError("");

    if (!validateCurrentStep() || submitting) {
      return;
    }

    setSubmitting(true);

    try {
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
          denuncianteNome: form.anonima ? null : form.denuncianteNome || null,
          denuncianteEmail: form.anonima ? null : form.denuncianteEmail || null,
          denuncianteTelefone: form.anonima ? null : form.denuncianteTelefone || null,
          aceiteTermos: form.aceiteTermos
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setFieldErrors(result.campos ?? {});
        throw new Error(result.erro ?? "Não foi possível enviar a denúncia agora.");
      }

      sessionStorage.setItem("ultimoProtocoloDenuncia", result.protocolo);
      router.push("/denunciar/enviada");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Não foi possível enviar a denúncia agora.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6" aria-busy={submitting || uploading || undefined}>
      <StepIndicator steps={steps} />

      {formError && (
        <div className="rounded-soft border border-danger-600/30 bg-danger-100 p-4 text-sm font-semibold leading-6 text-danger-600" role="alert">
          {formError}
        </div>
      )}

      <NeuCard>
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
                    icon={categoria.icone}
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
