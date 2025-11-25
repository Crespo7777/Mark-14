-- supabase/migrations/20251126000000_create_map_system.sql

-- 1. Tabela de Cenas (Mapas)
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  grid_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Tokens (Peões no mapa)
CREATE TABLE IF NOT EXISTS public.scene_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE NOT NULL,
  
  -- Coordenadas X e Y em percentagem (0 a 100) para ser responsivo
  x DOUBLE PRECISION DEFAULT 50.0 NOT NULL,
  y DOUBLE PRECISION DEFAULT 50.0 NOT NULL,
  
  -- Tamanho do token (escala: 1 = normal, 2 = grande, etc.)
  scale DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
  
  -- Ligações opcionais a Fichas ou NPCs (para mostrar o Avatar/Nome correto)
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  npc_id UUID REFERENCES public.npcs(id) ON DELETE CASCADE,
  
  -- Se não estiver ligado a ninguém, usa estes campos manuais
  label TEXT,
  custom_image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Segurança (RLS)

-- Habilitar RLS
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para SCENES
-- Mestre gere tudo
CREATE POLICY "Masters can manage scenes" ON public.scenes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = scenes.table_id AND tables.master_id = auth.uid()));

-- Jogadores apenas veem
CREATE POLICY "Players can view scenes" ON public.scenes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = scenes.table_id AND table_members.user_id = auth.uid()));

-- Políticas para TOKENS
-- Mestre gere tudo
CREATE POLICY "Masters can manage tokens" ON public.scene_tokens FOR ALL
  USING (EXISTS (SELECT 1 FROM public.scenes JOIN public.tables ON scenes.table_id = tables.id WHERE scene_tokens.scene_id = scenes.id AND tables.master_id = auth.uid()));

-- Jogadores podem ver tokens da cena ativa
CREATE POLICY "Players can view tokens" ON public.scene_tokens FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scenes JOIN public.table_members ON scenes.table_id = table_members.table_id WHERE scene_tokens.scene_id = scenes.id AND table_members.user_id = auth.uid()));

-- Jogadores podem MOVER os seus PRÓPRIOS tokens (Personagens ligados a eles)
CREATE POLICY "Players can move own tokens" ON public.scene_tokens FOR UPDATE
  USING (
    character_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.characters WHERE characters.id = scene_tokens.character_id AND characters.player_id = auth.uid())
  )
  WITH CHECK (
    character_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.characters WHERE characters.id = scene_tokens.character_id AND characters.player_id = auth.uid())
  );

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes, public.scene_tokens;