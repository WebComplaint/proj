# Web Complaint - Sistema Web de Denúncia Escolar

Web Complaint é uma aplicação web para registro, acompanhamento e gestão de denúncias escolares. O foco do produto é oferecer um canal acolhedor, acessível e seguro para estudantes relatarem situações como bullying, assédio, abuso, discriminação, ameaças e violência física, de forma anônima ou identificada.

O projeto foi construido com uma direcao visual calma, mobile-first e sem aparencia burocratica. A interface usa um design system proprio com neumorfismo hibrido: superficies suaves e flutuantes, mas botoes, campos e estados de foco com contraste real.

## Sumario

- [Objetivo do produto](#objetivo-do-produto)
- [Principais funcionalidades](#principais-funcionalidades)
- [Stack](#stack)
- [Regras de negocio implementadas](#regras-de-negocio-implementadas)
- [Design system](#design-system)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados)
- [Rotas da aplicacao](#rotas-da-aplicacao)
- [API](#api)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [Como rodar localmente](#como-rodar-localmente)
- [Banco de dados, migracao e seed](#banco-de-dados-migracao-e-seed)
- [Autenticacao e permissoes](#autenticacao-e-permissoes)
- [Uploads](#uploads)
- [E-mails](#e-mails)
- [Acessibilidade e responsividade](#acessibilidade-e-responsividade)
- [Scripts](#scripts)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

## Objetivo do produto

O sistema atende tres necessidades principais:

1. Permitir que estudantes registrem denuncias de forma curta, clara e segura.
2. Permitir que o denunciante acompanhe o andamento pelo protocolo.
3. Dar a equipe escolar um painel para triagem, tratamento, comentarios, historico e relatorios.

O publico principal sao adolescentes de 13 a 18 anos, geralmente usando celular e muitas vezes em momento de tensao. Por isso, as telas publicas evitam excesso de texto, formularios longos em uma unica pagina, cores agressivas e linguagem fria.

## Principais funcionalidades

- Paginas publicas estaticas:
  - Inicio
  - Como funciona
  - Privacidade
  - Ajuda
- Barra fixa de emergencia em todas as paginas publicas.
- Formulario de denuncia em 4 etapas:
  - O que aconteceu
  - Detalhes opcionais
  - Provas/anexos
  - Identificacao e envio
- Denuncia anonima sem coleta de dados pessoais.
- Denuncia identificada com e-mail obrigatorio para atualizacoes.
- Geracao de protocolo unico e nao sequencial.
- Tela de confirmacao com cartao de protocolo.
- Consulta publica por protocolo com rate limit.
- Linha do tempo publica sem notas internas.
- Login com NextAuth.
- Protecao de rotas do painel via middleware e API.
- Painel com dashboard, indicadores e alerta de SLA.
- Listagem de denuncias com filtros, busca, ordenacao e paginacao.
- Detalhe do caso com status, prioridade, responsavel, anexos, historico e comentarios.
- Comentarios internos e respostas publicas.
- Gestao de usuarios para administradores.
- Gestao de categorias para administradores.
- Relatorios e exportacao CSV.
- Notificacoes por e-mail para denuncias identificadas.

## Stack

- Next.js 14+ com App Router
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- MySQL
- NextAuth
- Zod
- bcryptjs
- Resend, opcional, para envio de e-mail

Nao sao usadas bibliotecas de UI prontas como MUI, Chakra ou shadcn/ui. Os componentes visuais sao proprios.

## Regras de negocio implementadas

### Denuncia

- Denuncia anonima nao coleta nem armazena nome, e-mail, telefone, IP persistido ou fingerprint.
- Toda denuncia recebe protocolo unico no formato `DEN-AAAA-XXXXXX`.
- O protocolo usa 6 caracteres aleatorios sem ambiguos: sem `0`, `O`, `1`, `I`, `L`.
- O protocolo e exibido uma unica vez na tela de confirmacao.
- A consulta por protocolo e publica, mas limitada a 5 tentativas por 10 minutos por IP.
- O IP usado no rate limit fica apenas em memoria, nao no banco.
- Anexos sao limitados a 5 arquivos.
- Cada anexo pode ter no maximo 10 MB.
- Tipos permitidos: `jpg`, `jpeg`, `png`, `webp`, `pdf`.
- Validacao de anexos tambem ocorre no servidor.
- Aceite do termo de consentimento e politica de privacidade e obrigatorio.
- Campos obrigatorios da denuncia: categoria e descricao com pelo menos 20 caracteres.

### Tratamento e status

Status disponiveis:

```text
RECEBIDA
EM_ANALISE
EM_ANDAMENTO
RESOLVIDA
ARQUIVADA
```

Fluxo permitido:

```text
RECEBIDA -> EM_ANALISE -> EM_ANDAMENTO -> RESOLVIDA
     \          \              \             \
      \          \              \             -> ARQUIVADA
       \          \              -> ARQUIVADA
        \          -> ARQUIVADA
         -> ARQUIVADA

RESOLVIDA/ARQUIVADA -> EM_ANDAMENTO
```

Outras regras:

- Nao e permitido voltar para `RECEBIDA`.
- Toda mudanca de status gera historico.
- Historico e somente leitura.
- Denuncias nao sao excluidas; o fluxo correto e arquivar.
- Notas internas aparecem somente para equipe.
- Respostas publicas aparecem na consulta por protocolo.
- Prioridades disponiveis: `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`.
- Categorias `abuso`, `violencia_fisica` e `assedio` entram com prioridade padrao `ALTA`.
- Denuncias paradas em `RECEBIDA` por mais de 48 horas recebem destaque visual de SLA.
- Denuncias identificadas com e-mail recebem notificacoes em mudancas de status e respostas publicas.

### Usuarios e seguranca

- Senhas sao armazenadas com bcrypt.
- Usuario inativo nao faz login.
- Usuario nao e excluido; e desativado.
- Apenas administradores gerenciam usuarios, categorias e relatorios.
- Rotas de painel exigem sessao valida.
- APIs do painel tambem validam permissao, nao dependendo apenas do front-end.

### Seguranca do usuario final

Todas as paginas publicas exibem uma barra de emergencia com:

- 190 - Policia Militar
- Disque 100 - Direitos Humanos
- Conselho Tutelar do municipio
- CVV 188 - apoio emocional 24h

## Design system

O conceito visual e "agua calma".

### Tokens principais

- Fundo base: `#E9F3F2`
- Sombra clara: `#FFFFFF`
- Sombra escura: `#C4DBD8`
- Areia: `#FDF4B0`
- Menta: `#A4DCB9`
- Agua: `#5BCEBF`
- Turquesa: `#32B9BE`
- Oceano: `#2E97B7`
- Botao solido: `#1B6B85`
- Texto principal: `#0D3A46`
- Texto secundario: `#3E6C79`
- Placeholder: `#7FA3AD`
- Erro: `#B4443F`

### Tipografia

- Titulos: Outfit
- Corpo e interface: Inter
- Protocolos e IDs: JetBrains Mono

As fontes sao carregadas em `src/app/layout.tsx` com `next/font/google`.

### Componentes base

Componentes do design system ficam em `src/components/ui`:

- `NeuButton`
- `NeuCard`
- `NeuInput`
- `NeuTextarea`
- `NeuSelect`
- `NeuCheckbox`
- `NeuRadio`
- `CategoriaCard`
- `StatusBadge`
- `PrioridadeBadge`
- `FileDropzone`
- `StepIndicator`
- `Timeline`
- `ProtocoloCard`
- `StatCard`
- `EmptyState`
- `Toast`
- `Modal`
- `EmergencyBar`

Existe uma pagina de demonstracao em:

```text
/design-system
```

### Regras visuais

- Superficies e cartoes usam sombra neumorfica dupla.
- Elementos interativos usam preenchimento solido e contraste real.
- Texto branco e usado somente sobre `#1B6B85`.
- Campos usam efeito inset mais borda de 1px.
- Foco de teclado sempre usa anel visivel de 3px.
- Alvo de toque minimo: 44x44px.
- Status nunca e comunicado apenas por cor; sempre tem rotulo.
- Transicoes seguem 200ms ease-out.
- `prefers-reduced-motion` e respeitado.

## Estrutura de pastas

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── denunciar/
│   │   ├── acompanhar/
│   │   ├── como-funciona/
│   │   ├── privacidade/
│   │   └── ajuda/
│   ├── (auth)/
│   │   └── login/
│   ├── painel/
│   │   ├── page.tsx
│   │   ├── denuncias/
│   │   ├── relatorios/
│   │   ├── usuarios/
│   │   ├── categorias/
│   │   └── conta/
│   ├── api/
│   ├── design-system/
│   ├── globals.css
│   ├── icon.svg
│   └── layout.tsx
├── components/
│   ├── auth/
│   ├── painel/
│   ├── publico/
│   └── ui/
├── lib/
├── types/
└── middleware.ts
```

Arquivos de banco:

```text
prisma/
├── migrations/
├── schema.prisma
└── seed.js
```

Assets publicos:

```text
public/
└── img/
    └── logo.svg
```

## Modelo de dados

O banco usa Prisma com MySQL.

Entidades principais:

- `Usuario`
- `Categoria`
- `Denuncia`
- `Anexo`
- `Historico`

Enums:

- `Perfil`
  - `COORDENADOR`
  - `ADMIN`
- `StatusDenuncia`
  - `RECEBIDA`
  - `EM_ANALISE`
  - `EM_ANDAMENTO`
  - `RESOLVIDA`
  - `ARQUIVADA`
- `Prioridade`
  - `BAIXA`
  - `MEDIA`
  - `ALTA`
  - `URGENTE`

Relacionamentos:

```text
Categoria 1--N Denuncia
Usuario   1--N Denuncia, como responsavel
Denuncia  1--N Anexo
Denuncia  1--N Historico
Usuario   1--N Historico
```

Campos sensiveis de denunciante existem somente para denuncia identificada:

- `denuncianteNome`
- `denuncianteEmail`
- `denuncianteTelefone`

Em denuncia anonima, esses campos nao devem ser preenchidos.

## Rotas da aplicacao

### Publicas

| Rota | Descricao |
|---|---|
| `/` | Pagina inicial com hero, passos e sigilo |
| `/denunciar` | Formulario de denuncia em 4 etapas |
| `/denunciar/enviada` | Confirmacao e cartao de protocolo |
| `/acompanhar` | Formulario de consulta por protocolo |
| `/acompanhar/[protocolo]` | Status e linha do tempo publica |
| `/como-funciona` | Explicacao do fluxo |
| `/privacidade` | Informacoes de sigilo e dados |
| `/ajuda` | Canais de ajuda e orientacao |
| `/design-system` | Demonstracao dos componentes base |

### Autenticacao

| Rota | Descricao |
|---|---|
| `/login` | Login da equipe escolar |

### Painel

| Rota | Permissao | Descricao |
|---|---|---|
| `/painel` | Coordenador ou admin | Dashboard |
| `/painel/denuncias` | Coordenador ou admin | Listagem com filtros |
| `/painel/denuncias/[id]` | Coordenador ou admin | Detalhe do caso |
| `/painel/conta` | Coordenador ou admin | Conta do usuario logado |
| `/painel/usuarios` | Admin | Gestao de usuarios |
| `/painel/categorias` | Admin | Gestao de categorias |
| `/painel/relatorios` | Admin | Relatorios e exportacao |

## API

Padrao de erro:

```json
{
  "erro": "Mensagem clara para a interface",
  "campos": {
    "campo": "Mensagem especifica do campo"
  }
}
```

Codigos usados:

- `201` para criacao
- `400` para validacao
- `401` sem sessao
- `403` sem permissao
- `404` nao encontrado
- `429` rate limit

### Rotas publicas

| Metodo | Rota | Descricao |
|---|---|---|
| `POST` | `/api/denuncias` | Cria denuncia e retorna protocolo |
| `POST` | `/api/upload` | Recebe e valida anexo |
| `GET` | `/api/denuncias/protocolo/[protocolo]` | Retorna status, categoria, data e historico publico |

### Rotas do painel

| Metodo | Rota | Permissao | Descricao |
|---|---|---|---|
| `GET` | `/api/painel/denuncias` | Coordenador ou admin | Lista denuncias com filtros e paginacao |
| `GET` | `/api/painel/denuncias/[id]` | Coordenador ou admin | Detalhe completo do caso |
| `PATCH` | `/api/painel/denuncias/[id]` | Coordenador ou admin | Altera status, prioridade e responsavel |
| `POST` | `/api/painel/denuncias/[id]/comentarios` | Coordenador ou admin | Cria nota interna ou resposta publica |
| `GET` | `/api/painel/estatisticas` | Coordenador ou admin | Dados agregados do dashboard |
| `GET` | `/api/painel/relatorios/export` | Admin | Exporta CSV |
| `GET` | `/api/painel/usuarios` | Admin | Lista usuarios |
| `POST` | `/api/painel/usuarios` | Admin | Cria usuario |
| `PATCH` | `/api/painel/usuarios` | Admin | Atualiza usuario |
| `GET` | `/api/painel/categorias` | Admin | Lista categorias |
| `POST` | `/api/painel/categorias` | Admin | Cria categoria |
| `PATCH` | `/api/painel/categorias` | Admin | Atualiza categoria |

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores.

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/denuncia_escolar"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="troque-este-valor"
EMAIL_FROM="Canal Escolar <notificacoes@escola.local>"
RESEND_API_KEY=""
ADMIN_NOME="Administrador"
ADMIN_EMAIL="admin@escola.local"
ADMIN_SENHA="troque-esta-senha"
```

### Descricao das variaveis

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `DATABASE_URL` | Sim | URL de conexao MySQL usada pelo Prisma |
| `NEXTAUTH_URL` | Sim | URL publica da aplicacao |
| `NEXTAUTH_SECRET` | Sim | Segredo usado pelo NextAuth |
| `EMAIL_FROM` | Nao | Remetente dos e-mails transacionais |
| `RESEND_API_KEY` | Nao | Chave da Resend; se vazia, o envio cai em fallback de console |
| `ADMIN_NOME` | Sim para seed | Nome do admin inicial |
| `ADMIN_EMAIL` | Sim para seed | E-mail do admin inicial |
| `ADMIN_SENHA` | Sim para seed | Senha do admin inicial |

Para gerar um `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Como rodar localmente

### Requisitos

- Node.js 20+
- npm
- MySQL 8+
- Git

### Passo a passo

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Crie o banco MySQL:

```sql
CREATE DATABASE denuncia_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Ajuste `DATABASE_URL` no `.env`.

5. Gere o Prisma Client:

```bash
npm run prisma:generate
```

6. Rode as migracoes:

```bash
npm run prisma:migrate
```

7. Rode o seed:

```bash
npm run prisma:seed
```

8. Suba o servidor local:

```bash
npm run dev
```

9. Acesse:

```text
http://localhost:3000
```

Login da equipe:

```text
http://localhost:3000/login
```

Use o e-mail e senha definidos em `ADMIN_EMAIL` e `ADMIN_SENHA`.

## Banco de dados, migracao e seed

### Migracao inicial

A migracao inicial fica em:

```text
prisma/migrations/20260808130000_init_denuncia_escolar/migration.sql
```

Ela cria:

- Tabelas principais
- Enums
- Relacionamentos
- Indices de status, categoria e data

### Seed inicial

O seed cria ou atualiza as categorias:

- `bullying`
- `cyberbullying`
- `assedio`
- `abuso`
- `discriminacao`
- `violencia_fisica`
- `ameaca`
- `outros`

Tambem cria ou atualiza o usuario administrador inicial usando:

- `ADMIN_NOME`
- `ADMIN_EMAIL`
- `ADMIN_SENHA`

A senha e armazenada com bcrypt, custo 12.

## Autenticacao e permissoes

Autenticacao via NextAuth com provider de credenciais.

Perfis:

| Perfil | Pode fazer |
|---|---|
| Denunciante | Criar denuncia e consultar protocolo, sem login |
| Coordenador | Ver e tratar denuncias, alterar status, comentar e assumir casos |
| Admin | Tudo do coordenador, mais usuarios, categorias e relatorios |

Protecoes:

- `src/middleware.ts` protege rotas sob `/painel`.
- Rotas administrativas sao restringidas a `ADMIN`.
- APIs sob `/api/painel` tambem validam sessao e permissao.
- Usuario inativo nao autentica.

## Uploads

A rota:

```text
POST /api/upload
```

aceita:

- `jpg`
- `jpeg`
- `png`
- `webp`
- `pdf`

Limites:

- Maximo 10 MB por arquivo
- Maximo 5 anexos por denuncia

No ambiente local, os arquivos sao salvos em:

```text
public/uploads/
```

Essa pasta esta no `.gitignore` porque contem arquivos enviados em runtime.

Importante para producao: em ambiente serverless, `public/uploads` nao e armazenamento persistente adequado. Para producao, use armazenamento externo, por exemplo:

- S3
- Cloudflare R2
- Vercel Blob
- MinIO

## E-mails

O envio fica centralizado em:

```text
src/lib/email.ts
```

Quando `RESEND_API_KEY` esta configurada, o sistema tenta enviar e-mails transacionais. Quando nao esta, usa fallback em console para facilitar desenvolvimento local.

Eventos que podem gerar e-mail:

- Mudanca de status
- Resposta publica ao denunciante

Restricoes:

- Apenas denuncias identificadas com e-mail recebem notificacao.
- Denuncias anonimas nao tem dados de contato para envio.
- Notas internas nunca sao enviadas ao denunciante.

## Acessibilidade e responsividade

Principios aplicados:

- Mobile-first.
- Formulario em etapas para reduzir carga cognitiva.
- Botoes com alvo minimo de 44x44px.
- Foco de teclado visivel.
- Labels e mensagens de erro descritivas.
- Status com cor e texto.
- Campos com borda e contraste real.
- Tabelas do painel viram lista de cartoes no mobile.
- Movimento reduzido respeitado via `prefers-reduced-motion`.
- Linguagem direta, acolhedora e sem prometer resultado.

Breakpoints esperados:

| Faixa | Comportamento |
|---|---|
| Mobile, menor que 640px | Coluna unica, botoes principais em largura total |
| Tablet, 640px a 1024px | Grades de 2 colunas onde fizer sentido |
| Desktop, maior que 1024px | Layout completo, painel com navegacao lateral |

## Scripts

| Script | Descricao |
|---|---|
| `npm run dev` | Sobe o ambiente de desenvolvimento |
| `npm run build` | Gera build de producao |
| `npm run start` | Roda a build de producao |
| `npm run lint` | Executa lint do Next |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Executa migracoes em desenvolvimento |
| `npm run prisma:seed` | Roda seed de categorias e admin |

## Qualidade antes de commit

Antes de abrir PR ou fazer deploy, rode:

```bash
npm run lint
npm run build
```

Se alterar o schema Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

Se precisar recriar dados iniciais:

```bash
npm run prisma:seed
```

## Deploy

### Checklist de producao

1. Criar banco MySQL acessivel pelo ambiente de deploy.
2. Configurar `DATABASE_URL`.
3. Configurar `NEXTAUTH_URL` com a URL final.
4. Configurar `NEXTAUTH_SECRET` forte.
5. Configurar `ADMIN_EMAIL`, `ADMIN_SENHA` e `ADMIN_NOME` antes do seed.
6. Configurar `RESEND_API_KEY`, se e-mail real for necessario.
7. Trocar armazenamento local de uploads por storage persistente.
8. Rodar migracoes no banco de producao.
9. Rodar seed inicial com seguranca.
10. Validar login, formulario, consulta por protocolo e painel.

### Vercel

O projeto e compativel com deploy em Vercel, mas exige atencao a dois pontos:

- MySQL precisa estar em um provedor externo.
- Uploads locais em `public/uploads` devem ser substituidos por storage persistente.

Com variaveis configuradas, o build padrao e:

```bash
npm run build
```

## Troubleshooting

### Warning: LF will be replaced by CRLF

O repositorio inclui `.gitattributes` para padronizar que arquivos de codigo fiquem em LF.

Se ainda aparecer warning local, rode:

```bash
git add --renormalize .
```

Opcionalmente, configure o Git para deixar o repositorio controlar quebras de linha:

```bash
git config --global core.autocrlf false
```

### Erro 403 ao dar push no GitHub

Se o erro disser que a permissao foi negada para outro usuario, o problema costuma ser credencial salva no Git Credential Manager, nao `user.name`.

Veja o usuario configurado para autoria:

```bash
git config --global user.name
git config --global user.email
```

Remova a conta antiga do GitHub:

```bash
git credential-manager github logout NOME_DA_CONTA
```

Depois tente:

```bash
git push -u origin main
```

### Build com `spawn EPERM` no Windows

Esse erro pode acontecer quando o ambiente bloqueia a criacao de workers do Next.js.

Tente fechar processos Node antigos e rodar novamente:

```bash
npm run build
```

Em ambientes com sandbox ou antivirus agressivo, pode ser necessario liberar o processo do Node.

### Prisma nao conecta no banco

Confira:

- MySQL esta rodando.
- O banco existe.
- Usuario e senha estao corretos.
- `DATABASE_URL` esta no formato correto.

Formato esperado:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/denuncia_escolar"
```

### Login nao funciona

Confira:

- O seed foi executado.
- `ADMIN_EMAIL` e `ADMIN_SENHA` estavam definidos antes do seed.
- O usuario esta ativo no banco.
- `NEXTAUTH_SECRET` esta configurado.
- `NEXTAUTH_URL` esta correto.

## Convencoes de Git

Arquivos ignorados ficam em `.gitignore`.

Arquivos atualmente ignorados incluem:

- Dependencias
- Build do Next
- Variaveis de ambiente reais
- Uploads locais
- Assets brutos da pasta `img/`
- Logs
- Arquivos temporarios de sistema/editor

O arquivo `.gitattributes` define que codigo e configuracao usam LF, evitando warnings de CRLF no Windows.

## Observacoes de seguranca

- Este sistema nao substitui atendimento de emergencia.
- Dados anonimos nao devem receber campos pessoais.
- O protocolo e a unica forma de acompanhamento para denuncias anonimas.
- Notas internas nunca devem aparecer nas rotas publicas.
- Mudancas de status precisam ser registradas no historico.
- Usuarios devem ser desativados, nao excluidos.
- Denuncias devem ser arquivadas, nao excluidas.

## Licenca

Projeto privado, criado para uso academico e evolucao como SaaS escolar.
