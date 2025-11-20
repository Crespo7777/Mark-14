-- supabase/migrations/20251120100000_setup_storage.sql

-- 1. Criar o Bucket 'campaign-media' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança (RLS) para o Storage

-- (A) Quem pode ver/baixar ficheiros?
-- TODOS os utilizadores autenticados (Mestres e Jogadores)
CREATE POLICY "Any logged in user can view media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'campaign-media' AND auth.role() = 'authenticated' );

-- (B) Quem pode fazer upload?
-- Apenas os Mestres das mesas (simplificado: qualquer utilizador autenticado pode fazer upload para a sua mesa, 
-- mas vamos restringir por pasta/mesa no frontend para organizar).
-- Para simplificar a permissão de upload num VTT pessoal:
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'campaign-media' AND auth.role() = 'authenticated' );

-- (C) Quem pode apagar?
-- Apenas quem fez o upload (o dono do ficheiro)
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'campaign-media' AND auth.uid() = owner );