-- supabase/migrations/20251113180000_add_selective_sharing.sql

-- 1. Adicionar a nova coluna (array de UUIDs) em todas as tabelas relevantes
ALTER TABLE public.characters
ADD COLUMN shared_with_players UUID[] DEFAULT '{}'::uuid[] NOT NULL;

ALTER TABLE public.npcs
ADD COLUMN shared_with_players UUID[] DEFAULT '{}'::uuid[] NOT NULL;

ALTER TABLE public.journal_entries
ADD COLUMN shared_with_players UUID[] DEFAULT '{}'::uuid[] NOT NULL;


-- 2. Atualizar Política de Segurança (RLS) para CHARACTERS
DROP POLICY IF EXISTS "Players can view shared or own characters" ON public.characters;
CREATE POLICY "Players can view shared, own, or specific characters"
  ON public.characters FOR SELECT
  USING (
    player_id = auth.uid() -- (A) É o dono da ficha
    OR (
      -- (B) É uma ficha compartilhada com todos E é membro da mesa
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = characters.table_id
        AND table_members.user_id = auth.uid()
      )
    )
    OR (
      -- (C) O ID do jogador está na lista de compartilhamento
      auth.uid() = ANY(shared_with_players)
    )
  );


-- 3. Atualizar Política de Segurança (RLS) para NPCS
DROP POLICY IF EXISTS "Players can view shared npcs" ON public.npcs;
CREATE POLICY "Players can view shared or specific npcs"
  ON public.npcs FOR SELECT
  USING (
    (
      -- (A) É um NPC compartilhado com todos E é membro da mesa
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = npcs.table_id
        AND table_members.user_id = auth.uid()
      )
    )
    OR (
      -- (B) O ID do jogador está na lista de compartilhamento
      auth.uid() = ANY(shared_with_players)
    )
  );


-- 4. Atualizar Política de Segurança (RLS) para JOURNAL_ENTRIES
DROP POLICY IF EXISTS "Players can view shared, own, or own character entries" ON public.journal_entries;
CREATE POLICY "Players can view shared, own, char, or specific entries"
  ON public.journal_entries FOR SELECT
  USING (
    (
      -- (A) Nota do Mestre partilhada com todos (Diário do Mundo)
      is_shared = true
      AND player_id IS NULL 
      AND character_id IS NULL 
      AND npc_id IS NULL
    )
    OR
    (
      -- (B) Nota privada do Jogador
      player_id = auth.uid()
    )
    OR
    (
      -- (C) Nota de um personagem que pertence ao jogador
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = journal_entries.character_id AND c.player_id = auth.uid()
      )
    )
    OR
    (
      -- (D) O ID do jogador está na lista de compartilhamento
      auth.uid() = ANY(shared_with_players)
    )
  );