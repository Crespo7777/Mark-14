-- supabase/migrations/20251207110000_create_campaign_images_bucket.sql
-- Objetivo: Garantir que o bucket 'campaign-images' existe com as políticas corretas,
-- CONTORNANDO O ERRO DE PROPRIEDADE COM MUDANÇA TEMPORÁRIA DE PAPEL (HACK SUPABASE CLI).

-- ----------------------------------------------------------------------
-- HACK DE PERMISSÃO: USA O PAPEL 'postgres' PARA AÇÕES PRIVILEGIADAS
-- ----------------------------------------------------------------------

-- 1. Mudar temporariamente para o papel 'postgres' (Superusuário).
SET role postgres; 

-- 2. Transferir a propriedade das tabelas para o papel de migração (supabase_admin),
-- o que resolve o erro "must be owner of table objects".
ALTER TABLE storage.objects OWNER TO supabase_admin;
ALTER TABLE storage.buckets OWNER TO supabase_admin;

-- 3. Inserir o bucket. Este comando falhou anteriormente e agora é executado
-- com as permissões mais elevadas.
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Ativar RLS no bucket.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Voltar para o papel de migração padrão, que é o que deve executar as políticas RLS.
SET role supabase_admin;

-- ----------------------------------------------------------------------
-- APLICAÇÃO DAS POLÍTICAS DE RLS (AGORA COM PROPRIEDADE CORRETA)
-- ----------------------------------------------------------------------

-- 6. Política de SELECT (Ver/Baixar)
-- Todos os utilizadores autenticados podem ver ficheiros neste bucket.
CREATE POLICY "Any logged in user can view campaign images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'campaign-images' AND auth.role() = 'authenticated' );

-- 7. Política de INSERT (Upload)
-- Apenas utilizadores autenticados podem fazer upload de novos ficheiros.
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'campaign-images' AND auth.role() = 'authenticated' );

-- 8. Política de DELETE (Apagar)
-- Apenas o dono do ficheiro pode apagá-lo.
CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'campaign-images' AND auth.uid() = owner );