-- Links de "esqueci minha senha" da equipe do painel.

CREATE TABLE "RedefinicaoSenha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RedefinicaoSenha_tokenHash_key" ON "RedefinicaoSenha"("tokenHash");
CREATE INDEX "RedefinicaoSenha_usuarioId_idx" ON "RedefinicaoSenha"("usuarioId");

ALTER TABLE "RedefinicaoSenha" ADD CONSTRAINT "RedefinicaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sem nenhuma policy: o navegador (anon/authenticated) nunca le esta tabela.
-- So o servidor, pelo Prisma, mexe nela.
ALTER TABLE "RedefinicaoSenha" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_complaint_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RedefinicaoSenha" TO web_complaint_app;
  END IF;
END $$;
