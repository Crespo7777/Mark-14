-- Adicionar coluna para controlar visibilidade na ficha
ALTER TABLE public.journal_entries
ADD COLUMN is_hidden_on_sheet BOOLEAN DEFAULT false NOT NULL;

-- Atualizar permissões (garantir que o RLS permite editar esta coluna)
-- (As políticas existentes de UPDATE já cobrem "all columns", então não é preciso mudar a policy, 
-- apenas garantir que o código front-end envia este campo).