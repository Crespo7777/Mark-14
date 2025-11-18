-- supabase/migrations/20251117160000_add_folders_to_all.sql

-- 1. PASTAS DE PERSONAGENS
CREATE TABLE IF NOT EXISTS public.character_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.character_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage character folders" ON public.character_folders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = character_folders.table_id AND tables.master_id = auth.uid()));

CREATE POLICY "Players can view character folders" ON public.character_folders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = character_folders.table_id AND table_members.user_id = auth.uid()));

-- 2. PASTAS DE DIÁRIO
CREATE TABLE IF NOT EXISTS public.journal_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.journal_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage journal folders" ON public.journal_folders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = journal_folders.table_id AND tables.master_id = auth.uid()));

CREATE POLICY "Players can view journal folders" ON public.journal_folders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = journal_folders.table_id AND table_members.user_id = auth.uid()));

-- 3. ALTERAR TABELAS EXISTENTES
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.character_folders(id) ON DELETE SET NULL;

ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.journal_folders(id) ON DELETE SET NULL;

-- 4. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'character_folders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.character_folders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'journal_folders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_folders;
  END IF;
  -- Garantir que updates nas tabelas principais notificam as novas colunas
  ALTER PUBLICATION supabase_realtime SET TABLE public.characters, public.journal_entries;
END $$;