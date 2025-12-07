-- Este comando cria a tabela 'items' que o seu frontend espera.
CREATE TABLE public.items (
  -- A coluna 'id' como chave primária e UUID
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Adicione as colunas que a sua aplicação espera, como 'name' e 'type'
  name text NOT NULL,
  type text, 

  -- A coluna 'table_id' é crucial, pois o seu código está filtrando por ela:
  -- ...or=(table_id.eq.6a0f0193-16c5-4135-885e-af5eb18ee652,table_id.is.null)...
  table_id uuid REFERENCES public.tables(id), 

  -- Adicione quaisquer outras colunas que a sua tabela 'items' precise (preço, descrição, etc.)
  price numeric,
  description text
);

-- Habilita RLS na nova tabela
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Cria uma política de visualização básica para começar (SELECT)
CREATE POLICY "Allow view items"
ON public.items AS PERMISSIVE
FOR SELECT
TO public
USING (true);