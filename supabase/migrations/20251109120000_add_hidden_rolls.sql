-- supabase/migrations/20251109120000_add_hidden_rolls.sql

-- 1. Adicionar a coluna 'recipient_id'
-- Se for NULL, a mensagem é pública (para todos na mesa).
-- Se tiver um ID, é uma mensagem privada para aquele usuário (o Mestre).
ALTER TABLE public.chat_messages
ADD COLUMN recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 2. Remover a política de visualização (SELECT) antiga
DROP POLICY IF EXISTS "Table members can view messages" ON public.chat_messages;

-- 3. Criar a nova política de visualização (SELECT)
-- Um usuário pode ler uma mensagem se:
-- (A) Ele é o Mestre da mesa (pode ver TUDO, incluindo sussurros).
-- OU
-- (B) A mensagem é pública (recipient_id IS NULL) E ele é um membro da mesa.
-- OU
-- (C) A mensagem é para ele (recipient_id = auth.uid()).
CREATE POLICY "Table members can view public or private messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = chat_messages.table_id
      AND tables.master_id = auth.uid()
    )
    OR (
      recipient_id IS NULL AND EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = chat_messages.table_id
        AND table_members.user_id = auth.uid()
      )
    )
    OR (recipient_id = auth.uid())
  );

-- 4. Habilitar Realtime para a nova coluna
ALTER PUBLICATION supabase_realtime SET TABLE public.chat_messages;