-- supabase/migrations/20251201000000_create_rules_system.sql

CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- HTML rico do editor
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS (Segurança)
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Mestre gere tudo
CREATE POLICY "Masters can manage rules" ON public.rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = rules.table_id AND tables.master_id = auth.uid()));

-- Jogadores veem as regras
CREATE POLICY "Players can view rules" ON public.rules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = rules.table_id AND table_members.user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rules;