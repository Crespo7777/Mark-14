-- supabase/migrations/20251207110000_create_campaign_images_bucket.sql
-- Objetivo: Garantir que o bucket 'campaign-images' existe com as políticas corretas.

-- 1. Criação do Novo Bucket 'campaign-images'
-- O argumento 'true' torna-o publicamente acessível para leitura, mas as RLS abaixo restringem o acesso de escrita.
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Ativar RLS (Row Level Security) no bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- 3. Política de SELECT (Ver/Baixar)
-- Todos os utilizadores autenticados podem ver ficheiros neste bucket.
CREATE POLICY "Any logged in user can view campaign images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'campaign-images' AND auth.role() = 'authenticated' );


-- 4. Política de INSERT (Upload)
-- Apenas utilizadores autenticados podem fazer upload de novos ficheiros.
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'campaign-images' AND auth.role() = 'authenticated' );


-- 5. Política de DELETE (Apagar)
-- Apenas o dono do ficheiro pode apagá-lo.
CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'campaign-images' AND auth.uid() = owner );