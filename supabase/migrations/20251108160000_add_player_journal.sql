-- supabase/migrations/20251108160000_add_player_journal.sql

-- 1. Adicionar a coluna player_id à tabela journal_entries
-- Esta coluna será NULL se for uma entrada do Mestre.
-- E terá a ID do jogador se for uma anotação privada do jogador.
ALTER TABLE public.journal_entries
ADD COLUMN player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 2. Remover a antiga política de visualização do jogador
-- A antiga política só permitia ver entradas compartilhadas (is_shared = true).
DROP POLICY IF EXISTS "Players can view shared journal entries" ON public.journal_entries;


-- 3. Criar a NOVA política de VISUALIZAÇÃO (SELECT) para jogadores
-- Jogadores agora podem ver entradas que:
-- (A) São compartilhadas pelo mestre (is_shared = true)
-- OU
-- (B) Pertencem a eles (player_id = auth.uid())
CREATE POLICY "Players can view shared or_own entries"
  ON public.journal_entries FOR SELECT
  USING (
    (
      is_shared = true
      AND player_id IS NULL -- Garante que é uma entrada do mestre
      AND EXISTS ( -- Verifica se o jogador é membro da mesa
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = journal_entries.table_id
        AND table_members.user_id = auth.uid()
      )
    )
    OR
    (
      player_id = auth.uid() -- O jogador pode ver suas próprias entradas
    )
  );


-- 4. Criar a NOVA política de CRIAÇÃO (INSERT) para jogadores
-- Jogadores agora podem criar suas próprias anotações.
CREATE POLICY "Players can create their own entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (
    -- O 'player_id' da nova entrada DEVE ser o ID do jogador logado
    player_id = auth.uid()
    AND EXISTS ( -- Verifica se o jogador é membro da mesa
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = journal_entries.table_id
      AND table_members.user_id = auth.uid()
    )
  );


-- 5. Criar a NOVA política de EDIÇÃO/DELEÇÃO (UPDATE/DELETE) para jogadores
-- Jogadores só podem editar ou deletar suas próprias anotações.
CREATE POLICY "Players can manage their own entries"
  ON public.journal_entries FOR UPDATE, DELETE
  USING (
    -- O 'player_id' da entrada DEVE ser o ID do jogador logado
    player_id = auth.uid()
  );

-- NOTA: A política "Masters can manage journal entries"
-- permanece intacta. Os Mestres continuarão com acesso total (SELECT, INSERT, UPDATE, DELETE)
-- a TODAS as entradas da mesa (tanto as dele quanto as dos jogadores).