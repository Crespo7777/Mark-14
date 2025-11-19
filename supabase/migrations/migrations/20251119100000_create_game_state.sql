-- supabase/migrations/20251119100000_create_game_state.sql

-- Tabela que guarda o estado atual da mesa (Cena, Música, Cutscene)
CREATE TABLE IF NOT EXISTS public.game_states (
  table_id UUID PRIMARY KEY REFERENCES public.tables(id) ON DELETE CASCADE,
  
  -- Imagem/Vídeo que aparece em overlay para todos (Cutscenes)
  active_cutscene_url TEXT, 
  active_cutscene_type TEXT CHECK (active_cutscene_type IN ('image', 'video', 'none')) DEFAULT 'none',
  
  -- Música de fundo (Link do Youtube ou MP3 direto)
  active_music_url TEXT,
  is_music_playing BOOLEAN DEFAULT false,
  
  -- ID da Cena/Mapa atual (para o futuro sistema de mapas)
  current_scene_id UUID, 
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- Mestre gere o estado
CREATE POLICY "Masters can manage game state" ON public.game_states FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = game_states.table_id AND tables.master_id = auth.uid()));

-- Jogadores apenas veem o estado
CREATE POLICY "Players can view game state" ON public.game_states FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = game_states.table_id AND table_members.user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;

-- Trigger para criar o estado inicial quando uma mesa é criada
CREATE OR REPLACE FUNCTION public.handle_new_table_state()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.game_states (table_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_table_created_state
  AFTER INSERT ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_table_state();