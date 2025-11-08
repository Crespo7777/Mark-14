-- supabase/migrations/20251108150000_add_sharing_to_characters.sql

-- 1. Adicionar a coluna 'is_shared' à tabela de personagens
ALTER TABLE public.characters
ADD COLUMN is_shared BOOLEAN DEFAULT false NOT NULL;

-- 2. Remover a política de visualização antiga (que era muito permissiva)
DROP POLICY "Players can view table characters" ON public.characters;

-- 3. Criar uma nova política de visualização mais restrita
-- Jogadores só podem ver fichas que:
-- (A) Pertencem a eles (player_id = auth.uid())
-- (B) Estão marcadas como is_shared = true E eles são membros da mesa
CREATE POLICY "Players can view shared or own characters"
  ON public.characters FOR SELECT
  USING (
    player_id = auth.uid()
    OR (
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = characters.table_id
        AND table_members.user_id = auth.uid()
      )
    )
  );

-- Habilitar Realtime para a nova coluna (para o switch funcionar ao vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;