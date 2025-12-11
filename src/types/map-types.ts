// src/types/map-types.ts

export interface MapToken {
  id: string;
  table_id: string;
  character_id?: string;
  type: "character" | "npc" | "monster";
  label: string;
  x: number;
  y: number;
  size: number;
  image_url?: string | null;
  color: string;
  rotation: number;
  status_effects?: string[];
  is_hidden?: boolean;
  // NOVO: Estatísticas independentes (Vida no Token)
  stats?: {
    hp: {
      current: number;
      max: number;
      temp?: number;
    }
  };
}

export interface FogShape {
  id: string;
  table_id: string;
  points: number[];
  type: 'reveal' | 'hide';
}

export interface MapData {
  id: string;
  tableId: string;
  gridSize: number;
  tokens: MapToken[];
  fog_shapes: FogShape[];
}