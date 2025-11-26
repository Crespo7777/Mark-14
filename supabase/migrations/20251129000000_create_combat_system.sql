-- supabase/migrations/20251129000000_create_combat_system.sql

-- 1. Tabela do Estado de Combate (Uma por mesa)
CREATE TABLE IF NOT EXISTS public.combat_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  
  is_active BOOLEAN DEFAULT false, -- Se o combate está a decorrer
  round INTEGER DEFAULT 1,         -- Número da rodada
  current_turn_id UUID,            -- ID do combatente que está a agir
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_id) -- Garante apenas um combate ativo por mesa
);

-- 2. Tabela de Combatentes (Quem está na luta)
CREATE TABLE IF NOT EXISTS public.combatants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combat_id UUID REFERENCES public.combat_states(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados visuais (copiados para não depender da ficha original durante o combate)
  name TEXT NOT NULL,
  initiative INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('character', 'npc', 'custom')) NOT NULL,
  
  -- Ligações opcionais (para puxar avatar ou clicar para abrir ficha)
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  npc_id UUID REFERENCES public.npcs(id) ON DELETE SET NULL,
  token_id UUID REFERENCES public.scene_tokens(id) ON DELETE SET NULL,
  
  -- Estado no combate
  hp_current INTEGER,
  hp_max INTEGER,
  is_dead BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false, -- Se os jogadores veem este combatente na lista
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Segurança (RLS)

ALTER TABLE public.combat_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combatants ENABLE ROW LEVEL SECURITY;

-- Políticas COMBAT_STATES
-- Mestre gere tudo
CREATE POLICY "Masters can manage combat state" ON public.combat_states FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tables WHERE tables.id = combat_states.table_id AND tables.master_id = auth.uid()));

-- Jogadores veem o estado
CREATE POLICY "Players can view combat state" ON public.combat_states FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.table_members WHERE table_members.table_id = combat_states.table_id AND table_members.user_id = auth.uid()));

-- Políticas COMBATANTS
-- Mestre gere tudo
CREATE POLICY "Masters can manage combatants" ON public.combatants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.combat_states JOIN public.tables ON combat_states.table_id = tables.id WHERE combatants.combat_id = combat_states.id AND tables.master_id = auth.uid()));

-- Jogadores veem combatentes (exceto os escondidos)
CREATE POLICY "Players can view visible combatants" ON public.combatants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.combat_states 
      JOIN public.table_members ON combat_states.table_id = table_members.table_id 
      WHERE combatants.combat_id = combat_states.id 
      AND table_members.user_id = auth.uid()
    )
    AND (is_hidden = false OR type = 'character') -- Jogadores veem personagens e NPCs não escondidos
  );

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_states, public.combatants;

-- 5. Trigger Automático: Criar estado de combate quando a mesa é criada (ou retroativamente)
-- (Nota: Para mesas já existentes, o código React vai criar se não existir, como fizemos no ImmersiveOverlay)