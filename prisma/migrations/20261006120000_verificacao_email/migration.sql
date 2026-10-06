-- Verificacao de e-mail para usuarios do painel e para quem denuncia.

CREATE TYPE "TipoVerificacaoEmail" AS ENUM ('USUARIO', 'DENUNCIANTE');

ALTER TABLE "Usuario" ADD COLUMN "emailVerificadoEm" TIMESTAMP(3);
ALTER TABLE "Denuncia" ADD COLUMN "denuncianteEmailVerificadoEm" TIMESTAMP(3);

-- Quem ja tinha conta antes desta mudanca e considerado verificado: a regra
-- vale para contas novas e para e-mails alterados, e ninguem fica trancado.
UPDATE "Usuario" SET "emailVerificadoEm" = now() WHERE "emailVerificadoEm" IS NULL;

CREATE TABLE "VerificacaoEmail" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tipo" "TipoVerificacaoEmail" NOT NULL,
    "email" TEXT NOT NULL,
    "usuarioId" TEXT,
    "denunciaId" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificacaoEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificacaoEmail_tokenHash_key" ON "VerificacaoEmail"("tokenHash");
CREATE INDEX "VerificacaoEmail_usuarioId_idx" ON "VerificacaoEmail"("usuarioId");
CREATE INDEX "VerificacaoEmail_denunciaId_idx" ON "VerificacaoEmail"("denunciaId");

ALTER TABLE "VerificacaoEmail" ADD CONSTRAINT "VerificacaoEmail_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificacaoEmail" ADD CONSTRAINT "VerificacaoEmail_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "Denuncia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sem nenhuma policy: o navegador (anon/authenticated) nunca le esta tabela.
-- So o servidor, pelo Prisma, mexe nela.
ALTER TABLE "VerificacaoEmail" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_complaint_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "VerificacaoEmail" TO web_complaint_app;
  END IF;
END $$;
