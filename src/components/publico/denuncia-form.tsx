"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o FORMULARIO DE DENUNCIA em 3 etapas, o componente mais importante da
 * parte publica do sistema.
 *
 * As 3 etapas:
 *   1. Relato   -> categoria e descricao (as unicas obrigatorias).
 *   2. Detalhes -> data, local e envolvidos (tudo opcional).
 *   3. Envio    -> anonima ou identificada, telefone e o aceite do termo.
 *
 * Por que dividir em etapas? Uma tela unica com 10 campos assusta quem ja
 * esta nervoso para denunciar. Perguntas curtas, uma de cada vez, reduzem
 * a desistencia no meio do caminho.
 *
 * Duas decisoes que valem citar na apresentacao:
 *
 *   - Os campos de nome e e-mail so aparecem na tela DEPOIS que a pessoa
 *     escolhe se identificar. Na opcao anonima eles nao existem. O telefone
 *     e obrigatorio nas duas opcoes; na anonima, so o administrador o ve.
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CategoriaCard,
  CategoriaIcone,
  NeuButton,
  NeuCard,
  NeuCheckbox,
  NeuInput,
  NeuTextarea,
  StepIndicator
} from "@/components/ui";
import { categoriasIniciais } from "@/lib/categorias";
import { DATA_MINIMA_OCORRIDO, FOLGA_RELOGIO_MS, toLocalInputValue } from "@/lib/date-utils";
import { formatarTelefone, telefoneValido } from "@/lib/telefone";

// BLOCO 2 - Tudo que o formulario guarda enquanto a pessoa preenche.
// E a "ficha em branco" que vai sendo completada etapa por etapa.
type FormState = {
  categoriaSlug: string;
  descricao: string;
  dataOcorrido: string;
  local: string;
  envolvidos: string;
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
  anonima: true,
  denuncianteNome: "",
  denuncianteEmail: "",
  denuncianteTelefone: "",
  aceiteTermos: false
};

export function DenunciaForm() {
  // BLOCO 5 - A MEMORIA DO FORMULARIO.
  // Cada linha guarda uma informacao que muda enquanto a pessoa usa a tela.
  // Quando qualquer uma delas muda, a tela se redesenha sozinha.
  const router = useRouter();                                              // leva para outra pagina no fim
  const [step, setStep] = useState(0);                                     // etapa atual (0 a 2)
  const [form, setForm] = useState<FormState>(initialState);               // o que ja foi preenchido
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // erros por campo
  const [formError, setFormError] = useState("");                          // erro geral do topo
  const [submitting, setSubmitting] = useState(false);                     // esta enviando a denuncia?

  // Conta os caracteres do relato para mostrar "35/20 caracteres minimos".
  const descriptionCount = form.descricao.trim().length;

  // BLOCO 6 - Calcula a situacao de cada bolinha da trilha de etapas:
  // concluida (completed), atual (current) ou ainda por vir (pending).
  const steps = useMemo(
    () => [
      { label: "Relato", state: step > 0 ? "completed" : step === 0 ? "current" : "pending" },
      { label: "Detalhes", state: step > 1 ? "completed" : step === 1 ? "current" : "pending" },
      { label: "Envio", state: step === 2 ? "current" : "pending" }
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

    // Etapa 2 (Detalhes): a data e opcional, mas nao pode estar no futuro.
    // O campo ja bloqueia os dias futuros no calendario; esta conferencia
    // pega quem digitou a data a mao.
    if (step === 1 && form.dataOcorrido) {
      const data = new Date(form.dataOcorrido);

      if (Number.isNaN(data.getTime()) || data < new Date(DATA_MINIMA_OCORRIDO)) {
        errors.dataOcorrido = "Confira a data do ocorrido.";
      } else if (data.getTime() > Date.now() + FOLGA_RELOGIO_MS) {
        errors.dataOcorrido = "A data do ocorrido não pode ser no futuro. Informe uma data até hoje.";
      }
    }

    // Etapa 3 (Envio): o telefone e cobrado de todos, o e-mail so de quem
    // escolheu se identificar, e o aceite do termo e sempre obrigatorio.
    if (step === 2) {
      if (!form.denuncianteTelefone.trim()) {
        errors.denuncianteTelefone = "Informe um telefone com DDD para enviar a denúncia.";
      } else if (!telefoneValido(form.denuncianteTelefone)) {
        errors.denuncianteTelefone = "Informe um telefone válido com DDD, por exemplo (11) 91234-5678.";
      }

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

    setStep((current) => Math.min(current + 1, 2));
  }

  // BLOCO 10 - Botao "Voltar". Limpa os erros antes de voltar, porque nao faz
  // sentido cobrar de uma etapa que a pessoa esta deixando para tras.
  // Importante: voltar NAO apaga o que ja foi preenchido.
  function goBack() {
    setFormError("");
    setFieldErrors({});
    setStep((current) => Math.max(current - 1, 0));
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
          anonima: form.anonima,

          // A REGRA DO ANONIMATO, aplicada tambem aqui.
          // Leia: "se for anonima, mande vazio; senao, mande o valor".
          // Sendo anonima, nome e e-mail nem saem do navegador da pessoa.
          // O servidor repete essa mesma regra na hora de gravar, entao a
          // protecao existe nas duas pontas.
          denuncianteNome: form.anonima ? null : form.denuncianteNome || null,
          denuncianteEmail: form.anonima ? null : form.denuncianteEmail || null,

          // O telefone vai sempre: e obrigatorio nas duas opcoes.
          denuncianteTelefone: form.denuncianteTelefone,
          aceiteTermos: form.aceiteTermos
        })
      });
      const result = await response.json();

      // O servidor recusou: aproveita a lista de campos com problema que ele
      // devolveu e marca cada um em vermelho na tela.
      // Nem todo campo tem um lugar para mostrar o erro. Por isso as mensagens dos campos tambem vao para o aviso do
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
    <div className="grid gap-6" aria-busy={submitting || undefined}>
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
              {/* O "max" e o momento atual: o calendario nao deixa escolher
                  um dia futuro. O "min" barra erro de digitacao no ano. */}
              <NeuInput
                label="Data e horário aproximados"
                name="dataOcorrido"
                type="datetime-local"
                min={DATA_MINIMA_OCORRIDO}
                max={toLocalInputValue(new Date())}
                value={form.dataOcorrido}
                onChange={(event) => updateField("dataOcorrido", event.target.value)}
                hint="Do dia do ocorrido até hoje. Datas futuras não são aceitas."
                error={fieldErrors.dataOcorrido}
              />
              <NeuInput
                label="Local"
                name="local"
                placeholder="Sala, pátio, internet..."
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

        {/* ETAPA 3 - IDENTIFICACAO E ENVIO. A etapa mais delicada do sistema. */}
        {step === 2 && (
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
                    Seu nome e e-mail não são pedidos. Só o telefone, visível apenas para a administração.
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

            {/* OS CAMPOS DE NOME E E-MAIL SO EXISTEM AQUI DENTRO.
                Leia a condicao: "se NAO for anonima, mostre este bloco".
                Na opcao anonima, nome e e-mail nem chegam a ser desenhados na
                tela. Nao estao escondidos: nao existem.
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
              </div>
            )}

            {/* O TELEFONE fica fora do bloco acima porque e obrigatorio nas
                duas opcoes. A mascara monta (11) 91234-5678 enquanto a pessoa
                digita, e a dica muda conforme a opcao escolhida, deixando
                claro quem vai ver o numero. */}
            <NeuInput
              label="Telefone com DDD"
              name="denuncianteTelefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 91234-5678"
              maxLength={15}
              value={form.denuncianteTelefone}
              onChange={(event) => updateField("denuncianteTelefone", formatarTelefone(event.target.value))}
              hint={
                form.anonima
                  ? "Obrigatório. Na denúncia anônima, o telefone fica visível apenas para a administração da escola e só é usado se for preciso esclarecer o caso ou proteger alguém."
                  : "Obrigatório. Usado pela equipe da escola para entrar em contato sobre o caso."
              }
              error={fieldErrors.denuncianteTelefone}
            />

            {/* O TERMO DE CONSENTIMENTO, resumido no ponto em que a pessoa
                decide. Os links abrem em outra aba de proposito: sair desta
                pagina apagaria tudo o que ja foi preenchido. */}
            <section className="rounded-soft bg-base p-4 text-sm leading-6 text-text-secondary shadow-neuro-inset" aria-labelledby="resumo-termo">
              <h3 id="resumo-termo" className="font-bold text-text-primary">Termo de consentimento e privacidade</h3>
              <ul className="mt-2 grid list-disc gap-1 pl-5">
                <li>Seus dados serão usados apenas para registrar, apurar e acompanhar esta denúncia.</li>
                <li>Somente a equipe autorizada da escola acessa o caso.</li>
                <li>Na denúncia anônima, nome e e-mail não são coletados, e o telefone fica restrito à administração.</li>
                <li>Você pode pedir acesso, correção ou exclusão dos seus dados à escola, informando o protocolo.</li>
              </ul>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link className="font-bold text-text-primary underline" href="/termo-de-consentimento" target="_blank" rel="noopener">
                  Ler o termo de consentimento completo
                </Link>
                <Link className="font-bold text-text-primary underline" href="/privacidade" target="_blank" rel="noopener">
                  Ler a política de privacidade
                </Link>
              </p>
            </section>

            <NeuCheckbox
              name="aceiteTermos"
              label="Li e aceito o termo de consentimento e a política de privacidade"
              description="O envio só acontece depois deste aceite."
              checked={form.aceiteTermos}
              onChange={(event) => updateField("aceiteTermos", event.target.checked)}
              error={fieldErrors.aceiteTermos}
            />
          </section>
        )}
      </NeuCard>

      {/* BLOCO 15 - A NAVEGACAO ENTRE AS ETAPAS.
          Nas duas primeiras aparece "Continuar"; na ultima, "Enviar denuncia".
          Trocar o texto do botao deixa claro que aquele clique e o definitivo. */}
      <div className="grid gap-3 sm:flex sm:justify-between">
        <NeuButton variant="ghost" onClick={goBack} disabled={step === 0 || submitting}>
          Voltar
        </NeuButton>
        {step < 2 ? (
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
