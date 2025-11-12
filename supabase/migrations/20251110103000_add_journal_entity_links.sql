-- ===== INÍCIO DO SCRIPT DE CORREÇÃO =====
-- Este script combina TODAS as migrações do diário e corrige os erros.

-- PASSO 1: Adicionar todas as colunas em falta (com verificação)
DO $$
BEGIN
  -- Adiciona a coluna 'player_id' (da migração ...160000)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_entries' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE public.journal_entries
    ADD COLUMN player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona as colunas 'character_id' e 'npc_id' (da migração ...add_journal_entity_links)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_entries' AND column_name = 'character_id'
  ) THEN
    ALTER TABLE public.journal_entries
    ADD COLUMN character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_entries' AND column_name = 'npc_id'
  ) THEN
    ALTER TABLE public.journal_entries
    ADD COLUMN npc_id UUID REFERENCES public.npcs(id) ON DELETE SET NULL;
  END IF;
END$$;


-- PASSO 2: Limpar TODAS as políticas de jogador anteriores
DROP POLICY IF EXISTS "Players can view shared journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can view shared or_own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can create their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can manage their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can update their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can delete their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can view shared, own, or own character entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can create their own or character entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can manage their own or character entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can update their own or character entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Players can delete their own or character entries" ON public.journal_entries;


-- PASSO 3: Criar as políticas FINAIS E CORRETAS

-- Política de VISUALIZAÇÃO (SELECT)
CREATE POLICY "Players can view shared, own, or own character entries"
  ON public.journal_entries FOR SELECT
  USING (
    (
      -- (A) Notas do Mestre partilhadas (Diário do Mundo)
      is_shared = true
      AND player_id IS NULL 
      AND character_id IS NULL 
      AND npc_id IS NULL
    )
    OR
    (
      -- (B) Notas privadas do Jogador
      player_id = auth.uid()
    )
    OR
    (
      -- (C) Notas de um personagem que pertence ao jogador
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
  );

-- Política de CRIAÇÃO (INSERT)
CREATE POLICY "Players can create their own or character entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_members tm
      WHERE tm.table_id = journal_entries.table_id
      AND tm.user_id = auth.uid()
    )
    AND (
      (
        -- (A) Criar uma nota pessoal
        player_id = auth.uid()
      )
      OR
      (
        -- (B) Criar uma nota para um personagem que lhe pertence
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
        )
      )
    )
  );

-- Política de GESTÃO (UPDATE) -- SEPARADA
CREATE POLICY "Players can update their own or character entries"
  ON public.journal_entries FOR UPDATE
  USING (
    (
      player_id = auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
  );
  
-- Política de GESTÃO (DELETE) -- SEPARADA
CREATE POLICY "Players can delete their own or character entries"
  ON public.journal_entries FOR DELETE
  USING (
    (
      player_id = auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
  );
  
-- ===== FIM DO SCRIPT DE CORREÇÃO =====