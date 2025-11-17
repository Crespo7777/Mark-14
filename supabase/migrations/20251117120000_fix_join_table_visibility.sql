-- supabase/migrations/20251117120000_fix_join_table_visibility.sql

-- Correção: A política anterior impedia não-membros de verem a mesa.
-- Isto quebrava o diálogo "Entrar em Mesa".

-- 1. Remover a política restritiva criada na migração do webhook
DROP POLICY IF EXISTS "Players can view tables they are members of" ON public.tables;

-- 2. Restaurar a política de leitura pública
-- Isto permite que qualquer utilizador autenticado veja a lista de mesas disponíveis
CREATE POLICY "Anyone can view tables"
  ON public.tables FOR SELECT
  USING (true);