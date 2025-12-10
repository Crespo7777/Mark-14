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
}

// --- NOVO: Definição de uma área revelada ---
export interface FogShape {
  id: string;
  table_id: string;
  points: number[]; // [x1, y1, x2, y2, ...] - Coordenadas do polígono
  type: 'reveal' | 'hide';
}

export interface MapData {
  id: string;
  tableId: string;
  gridSize: number;
  tokens: MapToken[];
  fog_shapes: FogShape[]; // Áreas de nevoeiro reveladas
}