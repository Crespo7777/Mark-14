-- supabase/migrations/20251117180000_allow_player_folders.sql

-- 1. Atualizar RLS para PASTAS DE PERSONAGENS
-- Removemos a política que dava permissão apenas ao Mestre
DROP POLICY IF EXISTS "Masters can manage character folders" ON public.character_folders;

-- Criamos uma política que permite a QUALQUER membro da mesa gerir pastas
-- (Assim, jogadores podem criar suas próprias pastas para organizar fichas)
CREATE POLICY "Table members can manage character folders"
  ON public.character_folders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = character_folders.table_id
      AND table_members.user_id = auth.uid()
    )
  );

-- 2. Atualizar RLS para PASTAS DE DIÁRIO
-- Removemos a política que dava permissão apenas ao Mestre
DROP POLICY IF EXISTS "Masters can manage journal folders" ON public.journal_folders;

-- Criamos uma política que permite a QUALQUER membro da mesa gerir pastas
CREATE POLICY "Table members can manage journal folders"
  ON public.journal_folders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = journal_folders.table_id
      AND table_members.user_id = auth.uid()
    )
  );

-- NOTA: As pastas de NPCs (npc_folders) continuam restritas ao Mestre,
-- pois os jogadores apenas visualizam os NPCs que o Mestre partilha.