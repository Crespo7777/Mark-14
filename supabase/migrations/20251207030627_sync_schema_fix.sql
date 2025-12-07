-- Adiciona a coluna se ela não existir
ALTER TABLE public.tables
ADD COLUMN image_url text;

-- Você pode adicionar um comentário para garantir a alteração
COMMENT ON COLUMN public.tables.image_url IS 'URL da imagem associada à mesa.';

-- Caso você não tenha certeza, adicione apenas uma linha de comentário para forçar a sincronização
-- ALTER TABLE public.tables ADD COLUMN dummy_col text;
-- ALTER TABLE public.tables DROP COLUMN dummy_col;