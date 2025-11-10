-- supabase/migrations/YYYYMMDDHHMMSS_add_master_chat_delete.sql

-- Permite que o mestre da mesa (e somente ele) delete mensagens do chat.
CREATE POLICY "Masters can delete chat messages"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = chat_messages.table_id
      AND tables.master_id = auth.uid()
    )
  );

-- Atualiza a publicação do realtime para garantir que o 'DELETE' seja enviado.
ALTER PUBLICATION supabase_realtime SET TABLE public.chat_messages;