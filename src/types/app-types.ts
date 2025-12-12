// src/types/app-types.ts

export interface Table {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  created_at: string;

  // --- NOVO CAMPO ---
  system_type: 'symbaroum' | 'pathfinder';
  
  // --- Capa da Aventura (Dashboard) ---
  image_url?: string | null; 

  // --- Configurações do Mapa VTT (Tabuleiro) ---
  map_background_url?: string | null;
  map_grid_size?: number; 
  map_grid_color?: string; 
  map_grid_opacity?: number; 
  map_fog_enabled?: boolean; 
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
  player_id: string | null; 
  name: string;
  avatar_url: string | null;
  shared_with_players: boolean;
  level: number;
  data: any; 
  created_at: string;
  updated_at: string;
}

export interface Npc {
  id: string;
  table_id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  data: any; 
  created_at: string;
}

export interface ItemTemplate {
  id: string;
  table_id: string | null; 
  name: string;
  type: string; 
  description: string | null;
  data: any; 
  image_url?: string | null;
  weight?: number;
  category?: string; 
  is_global?: boolean; 
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

export interface Combatant {
  id: string;
  table_id: string;
  token_id: string;
  character_id?: string;
  name: string;
  initiative: number;
  is_turn: boolean;
}