import {
  CategoriaCard,
  EmergencyBar,
  EmptyState,
  FileDropzone,
  Modal,
  NeuButton,
  NeuCard,
  NeuCheckbox,
  NeuInput,
  NeuRadio,
  NeuSelect,
  NeuTextarea,
  PrioridadeBadge,
  ProtocoloCard,
  StatCard,
  StatusBadge,
  StepIndicator,
  Timeline,
  Toast
} from "@/components/ui";

const statuses = ["recebida", "em_analise", "em_andamento", "resolvida", "arquivada"] as const;
const priorities = ["baixa", "media", "alta", "urgente"] as const;

export default function DesignSystemPage() {
  return (
    <>
      <EmergencyBar />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6">
        <header className="max-w-3xl">
          <p className="text-sm font-bold text-text-secondary">Sistema de denúncia escolar</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Design system</h1>
          <p className="mt-4 text-lg leading-8 text-text-secondary">
            Componentes base com neumorfismo híbrido, foco visível e contraste preservado.
          </p>
        </header>

        <DemoSection title="Cartões">
          <div className="grid gap-4 md:grid-cols-3">
            <NeuCard title="Flat" description="Superfície quieta." variant="flat">
              <p className="text-sm text-text-secondary">Usado quando a página já tem muita profundidade.</p>
            </NeuCard>
            <NeuCard title="Raised" description="Cartão principal." variant="raised">
              <p className="text-sm text-text-secondary">Sombra dupla para superfícies importantes.</p>
            </NeuCard>
            <NeuCard title="Pressed" description="Área rebaixada." variant="pressed">
              <p className="text-sm text-text-secondary">Boa para grupos selecionados ou leituras de protocolo.</p>
            </NeuCard>
          </div>
        </DemoSection>

        <DemoSection title="Botões">
          <div className="flex flex-wrap gap-3">
            <NeuButton size="sm">Enviar denúncia</NeuButton>
            <NeuButton variant="secondary">Ver detalhes</NeuButton>
            <NeuButton variant="ghost">Voltar</NeuButton>
            <NeuButton variant="danger">Arquivar denúncia</NeuButton>
            <NeuButton size="lg">Salvar alterações</NeuButton>
            <NeuButton loading>Enviar denúncia</NeuButton>
            <NeuButton disabled>Botão desabilitado</NeuButton>
          </div>
        </DemoSection>

        <DemoSection title="Campos">
          <div className="grid gap-5 md:grid-cols-2">
            <NeuInput label="Nome" name="nome" placeholder="Como devemos chamar você?" />
            <NeuInput label="E-mail" name="email" placeholder="voce@escola.com" error="Informe um e-mail válido para receber atualizações." />
            <NeuSelect label="Local" name="local" defaultValue="">
              <option value="" disabled>
                Selecione um local
              </option>
              <option>Sala</option>
              <option>Pátio</option>
              <option>Online</option>
            </NeuSelect>
            <NeuInput label="Campo desabilitado" name="desabilitado" placeholder="Indisponível" disabled />
            <div className="md:col-span-2">
              <NeuTextarea label="O que aconteceu?" name="relato" placeholder="Conte do seu jeito. Pode ser curto." hint="Você não precisa escrever nomes se não quiser." />
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Escolhas">
          <div className="grid gap-4 md:grid-cols-2">
            <NeuCheckbox label="Quero me identificar" name="identificacao" description="A escola poderá entrar em contato se precisar de mais informações." />
            <NeuCheckbox label="Não coletar contato" name="anonimo" description="A denúncia segue sem dados pessoais." defaultChecked />
            <NeuRadio label="Resposta pública" name="tipo-resposta" description="Aparece na consulta por protocolo." defaultChecked />
            <NeuRadio label="Nota interna" name="tipo-resposta" description="Visível apenas para a equipe." />
          </div>
        </DemoSection>

        <DemoSection title="Categorias">
          <div className="grid gap-4 md:grid-cols-4">
            <CategoriaCard icon="B" title="Bullying" description="Ameaças, humilhação ou intimidação." selected />
            <CategoriaCard icon="A" title="Assédio" description="Conduta invasiva ou constrangedora." />
            <CategoriaCard icon="D" title="Discriminação" description="Tratamento injusto ou ofensivo." />
            <CategoriaCard icon="O" title="Outra situação" description="Algo que não se encaixa acima." />
          </div>
        </DemoSection>

        <DemoSection title="Badges">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              {statuses.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {priorities.map((prioridade) => (
                <PrioridadeBadge key={prioridade} prioridade={prioridade} />
              ))}
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Upload">
          <FileDropzone
            label="Anexos"
            multiple
            files={[
              { name: "relato-print.png", size: "820 KB" },
              { name: "mensagem.pdf", size: "1.2 MB" }
            ]}
          />
          <div className="mt-5">
            <FileDropzone label="Upload com erro" error="O arquivo passa de 10 MB. Escolha um menor ou reduza a qualidade da imagem." />
          </div>
        </DemoSection>

        <DemoSection title="Etapas">
          <StepIndicator
            steps={[
              { label: "Relato", state: "completed" },
              { label: "Detalhes", state: "current" },
              { label: "Revisão", state: "pending" }
            ]}
          />
        </DemoSection>

        <DemoSection title="Linha do tempo">
          <Timeline
            items={[
              {
                title: "Denúncia recebida",
                description: "O relato entrou no canal da escola e aguarda análise inicial.",
                date: "08/08/2026",
                visibility: "public"
              },
              {
                title: "Nota da coordenação",
                description: "Observação interna para orientar o encaminhamento do caso.",
                date: "08/08/2026",
                visibility: "internal"
              }
            ]}
          />
        </DemoSection>

        <DemoSection title="Protocolo">
          <ProtocoloCard protocolo="DEN-2026-A1B2C3D4" />
        </DemoSection>

        <DemoSection title="Painel">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard value="12" label="Denúncias abertas" variation="3 em análise" icon="12" />
            <StatCard value="4" label="Casos urgentes" variation="Revisão prioritária" icon="!" />
            <StatCard value="8" label="Respostas públicas" variation="Últimos 7 dias" icon="7d" />
          </div>
        </DemoSection>

        <DemoSection title="Estados">
          <div className="grid gap-5 lg:grid-cols-2">
            <EmptyState
              title="Nenhuma denúncia encontrada"
              text="Ajuste os filtros ou acompanhe os novos registros quando eles chegarem."
              action={<NeuButton variant="secondary">Limpar filtros</NeuButton>}
              icon="0"
            />
            <div className="grid content-start gap-3">
              <Toast title="Alterações salvas" description="O histórico do caso foi atualizado." variant="success" />
              <Toast title="Revise o campo destacado" description="Há uma informação obrigatória pendente." variant="error" />
              <Toast title="Acompanhamento atualizado" description="A resposta pública já aparece no protocolo." variant="info" />
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Modal">
          <Modal title="Confirmar mudança de status" description="A ação será registrada no histórico somente leitura do caso.">
            <NeuTextarea label="Comentário" name="comentario-modal" placeholder="Explique o motivo da mudança." />
          </Modal>
        </DemoSection>
      </main>
    </>
  );
}

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <NeuCard>{children}</NeuCard>
    </section>
  );
}
