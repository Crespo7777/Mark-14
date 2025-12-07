-- Este comando força a visibilidade e o Supabase a reindexar o esquema:
ALTER TABLE public.tables REPLICA IDENTITY FULL;

-- Opcional: Adiciona as colunas se elas estiverem faltando no seu projeto remoto por algum motivo.
-- Altere o tipo se necessário (ex: de 'text' para 'varchar(255)')
ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS password text;