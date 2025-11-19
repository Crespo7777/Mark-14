-- supabase/migrations/20251118100000_create_shops_system.sql

-- 1. Tabela de Lojas (Ex: "Ferreiro da Vila", "Taverna do Porto")
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT, -- Opcional: para ficar bonito no futuro
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Itens da Loja
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 0 NOT NULL, -- Peso do item
  price INTEGER DEFAULT 0 NOT NULL,  -- Preço em ORTEGAS (moeda base)
  quantity INTEGER DEFAULT -1,       -- -1 significa infinito
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Segurança (RLS)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Políticas para LOJAS
-- Mestre pode fazer tudo
CREATE POLICY "Masters can manage shops" ON public.shops FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = shops.table_id AND tables.master_id = auth.uid()));

-- Jogadores podem VER as lojas da mesa
CREATE POLICY "Players can view shops" ON public.shops FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = shops.table_id AND table_members.user_id = auth.uid()));

-- Políticas para ITENS DA LOJA
-- Mestre pode fazer tudo
CREATE POLICY "Masters can manage shop items" ON public.shop_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shops JOIN public.tables ON shops.table_id = tables.id WHERE shop_items.shop_id = shops.id AND tables.master_id = auth.uid()));

-- Jogadores podem VER os itens
CREATE POLICY "Players can view shop items" ON public.shop_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shops JOIN public.table_members ON shops.table_id = table_members.table_id WHERE shop_items.shop_id = shops.id AND table_members.user_id = auth.uid()));

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops, public.shop_items;