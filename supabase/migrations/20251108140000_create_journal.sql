-- Tabela para entradas do diário
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Política do Mestre: Pode fazer tudo
CREATE POLICY "Masters can manage journal entries"
  ON public.journal_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = journal_entries.table_id
      AND tables.master_id = auth.uid()
    )
  );

-- Política do Jogador: Pode ver apenas o que é compartilhado
CREATE POLICY "Players can view shared journal entries"
  ON public.journal_entries FOR SELECT
  USING (
    is_shared = true
    AND (
      EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = journal_entries.table_id
        AND table_members.user_id = auth.uid()
      )
      OR EXISTS ( -- Permite ao mestre ver também
        SELECT 1 FROM public.tables
        WHERE tables.id = journal_entries.table_id
        AND tables.master_id = auth.uid()
      )
    )
  );

-- Trigger para 'updated_at' (a função 'update_updated_at' já existe)
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;