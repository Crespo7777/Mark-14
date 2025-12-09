// src/types/map-types.ts

export interface MapToken {
  id: string;
  characterId?: string; // Se estiver ligado a uma ficha
  type: "character" | "npc" | "monster";
  label: string;
  x: number;
  y: number;
  size: number; // Em unidades de grelha (ex: 1 = 1 quadrado)
  imageUrl?: string | null;
  color: string; // Cor da borda/fundo se não houver imagem
  rotation: number;
  statusEffects?: string[]; // Ex: ["blinded", "prone"]
  isHidden?: boolean; // Para o Mestre esconder tokens
}

export interface MapData {
  id: string;
  tableId: string;
  gridSize: number; // Ex: 50px
  tokens: MapToken[];
  fogOfWar: string[]; // Células exploradas (futuro)
}