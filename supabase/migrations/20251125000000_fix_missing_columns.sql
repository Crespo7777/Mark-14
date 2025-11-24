-- supabase/migrations/20251125000000_fix_missing_columns.sql

-- 1. Adicionar controlo global de lojas à tabela 'tables'
-- Isto corrige o erro onde o Mestre tenta abrir/fechar a loja e falha.
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS shops_open BOOLEAN DEFAULT false;

-- 2. Garantir permissões de leitura para todos os utilizadores autenticados
-- (A política "Masters can manage their tables" já cobre updates do Mestre)
GRANT SELECT (shops_open) ON public.tables TO authenticated;

-- 3. (Opcional, mas recomendado) Garantir que a política de SELECT do jogador inclui esta coluna
-- (Normalmente "USING (true)" ou a política específica cobre todas as colunas, mas é bom garantir)
-- Não é necessário alterar a política se ela já for SELECT * ou SELECT id, name...

-- Apenas garantimos que o Realtime notifica mudanças nesta coluna
ALTER PUBLICATION supabase_realtime SET TABLE public.tables;