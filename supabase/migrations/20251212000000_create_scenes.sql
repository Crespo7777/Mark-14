-- 1. Criar a tabela de Cenas (Scenes)
-- Mantemos table_id como text para compatibilidade
CREATE TABLE IF NOT EXISTS public.scenes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id text REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL DEFAULT 'Nova Cena',
    
    -- Configurações do Grid e Canvas
    width integer DEFAULT 4000 NOT NULL,
    height integer DEFAULT 4000 NOT NULL,
    grid_size integer DEFAULT 50 NOT NULL,
    grid_color text DEFAULT '#000000',
    grid_opacity numeric DEFAULT 0.5,
    background_color text DEFAULT '#1a1a1a',
    
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Adicionar referência à Cena Ativa na tabela Tables
-- Aqui active_scene_id é UUID porque scenes.id é UUID. Isso está correto.
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS active_scene_id uuid REFERENCES public.scenes(id) ON DELETE SET NULL;

-- 3. Criar a tabela de Tiles (Assets/Imagens dentro da cena)
CREATE TABLE IF NOT EXISTS public.map_tiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    scene_id uuid REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
    
    url text NOT NULL, 
    
    x numeric DEFAULT 0 NOT NULL,
    y numeric DEFAULT 0 NOT NULL,
    width numeric DEFAULT 100 NOT NULL,
    height numeric DEFAULT 100 NOT NULL,
    rotation numeric DEFAULT 0,
    scale_x numeric DEFAULT 1,
    scale_y numeric DEFAULT 1,
    
    z_index integer DEFAULT 0, 
    opacity numeric DEFAULT 1,
    is_locked boolean DEFAULT false, 
    
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Atualizar Tokens e Fog para pertencerem a uma Cena
ALTER TABLE public.map_tokens 
ADD COLUMN IF NOT EXISTS scene_id uuid REFERENCES public.scenes(id) ON DELETE CASCADE;

ALTER TABLE public.map_fog 
ADD COLUMN IF NOT EXISTS scene_id uuid REFERENCES public.scenes(id) ON DELETE CASCADE;

-- 5. Segurança (Row Level Security) - COM CORREÇÃO DE CAST ::text
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_tiles ENABLE ROW LEVEL SECURITY;

-- Políticas para SCENES
CREATE POLICY "Scenes viewable by table members" ON public.scenes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.table_members tm
            WHERE tm.table_id = scenes.table_id 
            AND tm.user_id = auth.uid()::text -- CORREÇÃO: Converter UUID para TEXT
        ) OR EXISTS (
            SELECT 1 FROM public.tables t
            WHERE t.id = scenes.table_id 
            AND t.master_id = auth.uid()::text -- CORREÇÃO: Converter UUID para TEXT
        )
    );

CREATE POLICY "Scenes editable by master" ON public.scenes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tables t
            WHERE t.id = scenes.table_id 
            AND t.master_id = auth.uid()::text -- CORREÇÃO: Converter UUID para TEXT
        )
    );

-- Políticas para TILES
CREATE POLICY "Tiles viewable by table members" ON public.map_tiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.scenes s
            JOIN public.table_members tm ON tm.table_id = s.table_id
            WHERE s.id = map_tiles.scene_id 
            AND tm.user_id = auth.uid()::text -- CORREÇÃO
        ) OR EXISTS (
            SELECT 1 FROM public.scenes s
            JOIN public.tables t ON t.id = s.table_id
            WHERE s.id = map_tiles.scene_id 
            AND t.master_id = auth.uid()::text -- CORREÇÃO
        )
    );

CREATE POLICY "Tiles editable by master" ON public.map_tiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.scenes s
            JOIN public.tables t ON t.id = s.table_id
            WHERE s.id = map_tiles.scene_id 
            AND t.master_id = auth.uid()::text -- CORREÇÃO
        )
    );