-- Este script corrige uma recursão infinita (infinite recursion)
-- entre as RLS de 'tables' e 'table_members'.

-- 1. Remover a política "FOR ALL" problemática em table_members.
DROP POLICY IF EXISTS "Table masters can manage members" ON public.table_members;
-- Limpar também a política com nome errado que falhou
DROP POLICY IF EXISTS "Masters can manage members (write-only)" ON public.table_members;


-- ####################
-- ### INÍCIO DA CORREÇÃO ###
-- ####################

-- 2a. Recriar a política para INSERT
CREATE POLICY "Masters can manage members (INSERT)"
  ON public.table_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = table_members.table_id
      AND tables.master_id = auth.uid()
    )
  );

-- 2b. Recriar a política para UPDATE
CREATE POLICY "Masters can manage members (UPDATE)"
  ON public.table_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = table_members.table_id
      AND tables.master_id = auth.uid()
    )
  );

-- 2c. Recriar a política para DELETE
CREATE POLICY "Masters can manage members (DELETE)"
  ON public.table_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = table_members.table_id
      AND tables.master_id = auth.uid()
    )
  );
  
-- ####################
-- ### FIM DA CORREÇÃO ###
-- ####################
  
-- 3. A política de SELECT "Users can view table members" (USING true)
-- [do ficheiro 20251108125657] continua a ser a principal política de SELECT,
-- mas agora já não é combinada (OR) com a política recursiva do Mestre.