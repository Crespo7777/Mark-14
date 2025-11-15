-- Remove as políticas de UPDATE e DELETE antigas para jogadores
DROP POLICY IF EXISTS "Players can update their own or character entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can delete their own or character entries" ON public.journal_entries;

-- Cria a NOVA política de UPDATE
CREATE POLICY "Players can update their own, char, or shared entries"
  ON public.journal_entries FOR UPDATE
  USING (
    (
      -- (A) É a minha nota pessoal
      player_id = auth.uid()
    )
    OR
    (
      -- (B) É a nota do meu personagem
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
    OR
    (
      -- (C) É uma nota que o Mestre partilhou comigo
      auth.uid() = ANY(shared_with_players)
    )
  );
  
-- Cria a NOVA política de DELETE
CREATE POLICY "Players can delete their own, char, or shared entries"
  ON public.journal_entries FOR DELETE
  USING (
    (
      -- (A) É a minha nota pessoal
      player_id = auth.uid()
    )
    OR
    (
      -- (B) É a nota do meu personagem
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
    OR
    (
      -- (C) É uma nota que o Mestre partilhou comigo
      auth.uid() = ANY(shared_with_players)
    )
  );