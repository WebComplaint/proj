-- Pasta PRIVADA "anexos" do Supabase Storage, onde ficam as fotos e PDFs
-- enviados junto com as denuncias.
--
-- Antes, a rota de upload tentava criar a pasta sozinha no primeiro envio.
-- Em producao essa criacao falhava e todo anexo voltava com erro 500. Criar
-- a pasta aqui, junto com o resto do banco, tira essa dependencia.
--
-- Mesmas regras da rota de upload: ate 10 MB e so jpg, png, webp ou pdf.
-- So roda em banco do Supabase (onde existe o schema "storage").

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'anexos',
      'anexos',
      false,
      10485760,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
