-- supabase/migrations/20251128000000_add_data_to_shop_items.sql

-- Adiciona a coluna JSONB 'data' para guardar stats (dano, armadura, etc.) nos itens da loja
ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Atualiza permissões de leitura (embora a política de SELECT * já deva cobrir, é boa prática)
GRANT SELECT(data) ON public.shop_items TO authenticated;