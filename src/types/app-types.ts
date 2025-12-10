// src/types/app-types.ts

export interface Table {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  created_at: string;
  
  // --- Configurações do Mapa VTT ---
  map_background_url?: string | null;
  map_grid_size?: number; // Padrão 50
  map_grid_color?: string; // Padrão '#ffffff'
  map_grid_opacity?: number; // Padrão 0.2
  map_fog_enabled?: boolean; // Padrão false (Controla se o Fog of War está ativo)
}

export interface TableMember {
  user_id: string;
  table_id: string;
  is_helper: boolean;
  joined_at: string;
}

export interface Character {
  id: string;
  table_id: string;
  player_id: string | null; // Pode ser null se for um NPC ou sem jogador
  name: string;
  avatar_url: string | null;
  shared_with_players: boolean;
  level: number;
  data: any; // JSONB com atributos, perícias, vida (toughness), etc.
  created_at: string;
  updated_at: string;
}

export interface Npc {
  id: string;
  table_id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  data: any; // JSONB com stats do NPC
  created_at: string;
}

export interface ItemTemplate {
  id: string;
  table_id: string | null; // Null = Global/Compêndio
  name: string;
  type: string; // 'weapon', 'armor', 'item', etc.
  description: string | null;
  data: any; // JSONB com dano, peso, preço, etc.
  image_url?: string | null;
  weight?: number;
  category?: string; // Helper para UI
  is_global?: boolean; // Helper visual
}

export interface ChatMessage {
  id: string;
  table_id: string;
  user_id: string;
  message: string;
  message_type: 'chat' | 'roll' | 'error' | 'info';
  recipient_id: string | null;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}