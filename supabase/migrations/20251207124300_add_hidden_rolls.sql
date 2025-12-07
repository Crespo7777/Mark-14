-- supabase/migrations/YYYYMMDDHHMMSS_add_hidden_rolls.sql

-- 1. Adicionar a coluna 'recipient_id'
-- Se for NULL, a mensagem é pública.
-- Se tiver um ID, é uma mensagem privada para aquele usuário (normalmente o Mestre).
ALTER TABLE public.chat_messages
ADD COLUMN recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- 2. Remover a política de visualização (SELECT) antiga
DROP POLICY "Table members can view messages" ON public.chat_messages;

-- 3. Criar a nova política de visualização
-- Um usuário pode ler uma mensagem se:
-- (A) A mensagem é pública (recipient_id IS NULL) E ele é membro da mesa/mestre.
-- OU
-- (B) A mensagem é para ele (recipient_id = auth.uid()).
-- OU
-- (C) Ele é o Mestre (e pode ver todas as mensagens, incluindo sussurros de jogadores para ele).
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

-- 4. Atualizar a política de envio (INSERT)
-- Não precisa de alteração, a política "Table members can send messages"
-- já permite que membros/mestre insiram mensagens.
-- A lógica de quem é o recipient_id será controlada pelo frontend.