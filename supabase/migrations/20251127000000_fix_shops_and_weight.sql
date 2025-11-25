-- supabase/migrations/20251127000000_fix_shops_and_weight.sql

-- 1. Adicionar coluna 'is_open' às lojas (estava em falta)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false;

-- 2. Atualizar permissões para garantir que todos veem esta coluna
GRANT SELECT(is_open) ON public.shops TO authenticated;

-- 3. Atualizar Realtime para notificar mudanças de estado da loja
ALTER PUBLICATION supabase_realtime SET TABLE public.shops;