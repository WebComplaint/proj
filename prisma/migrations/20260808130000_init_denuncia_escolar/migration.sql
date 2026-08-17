CREATE TYPE "Perfil" AS ENUM ('COORDENADOR', 'ADMIN');
CREATE TYPE "StatusDenuncia" AS ENUM ('RECEBIDA', 'EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA', 'ARQUIVADA');
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

CREATE TABLE "Usuario" (
  "id" TEXT NOT NULL,
  "authUserId" UUID NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "perfil" "Perfil" NOT NULL DEFAULT 'COORDENADOR',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Usuario_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE "Categoria" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "descricao" TEXT,
  "icone" TEXT,
  "prioridadePadrao" "Prioridade" NOT NULL DEFAULT 'MEDIA',
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Denuncia" (
  "id" TEXT NOT NULL,
  "protocolo" TEXT NOT NULL,
  "categoriaId" TEXT NOT NULL,
  "anonima" BOOLEAN NOT NULL DEFAULT true,
  "descricao" TEXT NOT NULL,
  "dataOcorrido" TIMESTAMP(3) WITH TIME ZONE,
  "local" TEXT,
  "envolvidos" TEXT,
  "status" "StatusDenuncia" NOT NULL DEFAULT 'RECEBIDA',
  "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
  "denuncianteNome" TEXT,
  "denuncianteEmail" TEXT,
  "denuncianteTelefone" TEXT,
  "responsavelId" TEXT,
  "criadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
  CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Anexo" (
  "id" TEXT NOT NULL,
  "denunciaId" TEXT NOT NULL,
  "arquivoUrl" TEXT NOT NULL,
  "nomeOriginal" TEXT NOT NULL,
  "tipoMime" TEXT NOT NULL,
  "tamanho" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Historico" (
  "id" TEXT NOT NULL,
  "denunciaId" TEXT NOT NULL,
  "usuarioId" TEXT,
  "statusAnterior" "StatusDenuncia",
  "statusNovo" "StatusDenuncia",
  "comentario" TEXT,
  "publico" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Historico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_authUserId_key" ON "Usuario"("authUserId");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");
CREATE UNIQUE INDEX "Denuncia_protocolo_key" ON "Denuncia"("protocolo");
CREATE INDEX "Denuncia_status_idx" ON "Denuncia"("status");
CREATE INDEX "Denuncia_categoriaId_idx" ON "Denuncia"("categoriaId");
CREATE INDEX "Denuncia_responsavelId_idx" ON "Denuncia"("responsavelId");
CREATE INDEX "Denuncia_criadoEm_idx" ON "Denuncia"("criadoEm");
CREATE INDEX "Anexo_denunciaId_idx" ON "Anexo"("denunciaId");
CREATE INDEX "Historico_denunciaId_idx" ON "Historico"("denunciaId");
CREATE INDEX "Historico_usuarioId_idx" ON "Historico"("usuarioId");

ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario_le_proprio_perfil" ON "Usuario" FOR SELECT TO authenticated USING ("authUserId" = (SELECT auth.uid()));
