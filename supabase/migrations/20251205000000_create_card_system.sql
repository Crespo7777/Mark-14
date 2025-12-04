-- Tabela para guardar os baralhos e cartas soltas
CREATE TABLE public.game_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    room_id UUID NOT NULL, -- Link para a sala/mesa atual
    
    -- Propriedades Visuais
    front_image_url TEXT NOT NULL, -- A arte da carta
    back_image_url TEXT DEFAULT '/card-back-default.png', -- O verso (pode ser padrão)
    label TEXT, -- Nome da carta (opcional)
    
    -- Propriedades de Estado (O que muda em tempo real)
    position_x FLOAT DEFAULT 0, -- Posição na mesa (horizontal)
    position_y FLOAT DEFAULT 0, -- Posição na mesa (vertical)
    is_face_up BOOLEAN DEFAULT FALSE, -- Se está virada para cima
    z_index INTEGER DEFAULT 0, -- Para saber qual carta está em cima de qual
    
    -- Dono (Se estiver nulo, está na mesa. Se tiver ID, está na "mão" do jogador)
    owner_id UUID 
);

-- Ativar Realtime para esta tabela (CRUCIAL para o VTT)
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_cards;

-- Políticas de Segurança (RLS) - Simplificado para começar
ALTER TABLE public.game_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um na sala pode ver as cartas" 
ON public.game_cards FOR SELECT 
USING (true); -- Aqui deverias filtrar por room_id na prática

CREATE POLICY "Qualquer um pode mover cartas" 
ON public.game_cards FOR UPDATE 
USING (true);

CREATE POLICY "Qualquer um pode criar cartas" 
ON public.game_cards FOR INSERT 
WITH CHECK (true);