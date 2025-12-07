-- 1. Garante que a coluna 'is_helper' seja criada se estiver faltando no esquema remoto.
ALTER TABLE public.table_members
ADD COLUMN IF NOT EXISTS is_helper boolean DEFAULT FALSE;

-- 2. Comando agressivo para forçar a re-leitura do esquema da tabela 'table_members' no PostgREST.
ALTER TABLE public.table_members REPLICA IDENTITY FULL;