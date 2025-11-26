-- supabase/migrations/20251130000000_add_fog_of_war.sql

-- 1. Adicionar colunas de Névoa à tabela de Cenas
ALTER TABLE public.scenes 
ADD COLUMN IF NOT EXISTS fog_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fog_data TEXT; -- Irá guardar a imagem da máscara em Base64

-- 2. Atualizar permissões (Garantir que todos veem, mas só Mestre edita via RLS existente)
-- A RLS existente "Masters can manage scenes" e "Players can view scenes" já cobre estas novas colunas,
-- pois são parte da tabela 'scenes'.

-- 3. Notificar o Realtime
ALTER PUBLICATION supabase_realtime SET TABLE public.scenes;