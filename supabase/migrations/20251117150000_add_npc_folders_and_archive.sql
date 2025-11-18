-- supabase/migrations/20251117150000_add_npc_folders_and_archive.sql

-- 1. Criar tabela de Pastas (Verifica se já existe)
CREATE TABLE IF NOT EXISTS public.npc_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS nas Pastas
ALTER TABLE public.npc_folders ENABLE ROW LEVEL SECURITY;

-- Políticas para Pastas (Apaga a antiga se existir antes de criar a nova)
DROP POLICY IF EXISTS "Masters can manage folders" ON public.npc_folders;
CREATE POLICY "Masters can manage folders"
  ON public.npc_folders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = npc_folders.table_id
      AND tables.master_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can view folders" ON public.npc_folders;
CREATE POLICY "Players can view folders"
  ON public.npc_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = npc_folders.table_id
      AND table_members.user_id = auth.uid()
    )
  );

-- Habilitar Realtime para Pastas (Verificação segura)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'npc_folders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.npc_folders;
  END IF;
END $$;

-- 2. Alterar tabela de NPCs (Usa IF NOT EXISTS para evitar o erro)
ALTER TABLE public.npcs
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.npcs
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.npc_folders(id) ON DELETE SET NULL;