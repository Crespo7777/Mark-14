// src/types/map-types.ts

export interface Scene {
  id: string;
  table_id: string;
  name: string;
  image_url: string;
  grid_active: boolean;
  created_at: string;
}

export interface SceneToken {
  id: string;
  scene_id: string;
  x: number;
  y: number;
  scale: number;
  character_id?: string | null;
  npc_id?: string | null;
  label?: string | null;
  custom_image_url?: string | null;
  
  // Campos virtuais vindos dos JOINS (opcionais)
  character?: { name: string, data: any }; 
  npc?: { name: string, data: any };
}