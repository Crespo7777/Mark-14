// src/types/database-types.ts

export type ItemCategory = 
  | 'quality' | 'weapon' | 'armor' | 'ability' | 'trait' | 'consumable' 
  | 'general' | 'mount' | 'construction' | 'service' | 'material' 
  | 'container' | 'ammunition' | 'animal' | 'asset' | 'clothing' 
  | 'tool' | 'food' | 'artifact' | 'trap' | 'spec_tool' | 'musical';

// Interfaces Específicas para o campo 'data'
export interface WeaponData {
  subcategory?: string;
  damage: string;
  attackAttribute: string;
  quality?: string;
  reloadAction?: string; // Para armas de projétil
  price?: string;
}

export interface ArmorData {
  subcategory?: string;
  protection: string;
  obstructive: string; // Penalidade
  quality?: string;
  price?: string;
}

export interface AbilityData {
  type: 'Habilidade' | 'Poder' | 'Ritual';
  corruptionCost?: string;
  associatedAttribute?: string;
  tradition?: string;
  novice: string;
  adept: string;
  master: string;
}

export interface TraitData {
  type: 'Traço' | 'Dádiva' | 'Fardo' | 'Monstruoso';
  cost?: string;
  novice: string;
  adept: string;
  master: string;
}

export interface GeneralData {
  effect?: string;
  price?: string;
  duration?: string; // Para consumíveis
  integrity?: string; // Construções
  resistance?: string; // Construções
  spotDifficulty?: string; // Armadilhas
  disarmDifficulty?: string; // Armadilhas
  [key: string]: any; // Flexibilidade para outros campos menores
}

// Tipo União para uso genérico
export type ItemData = WeaponData | ArmorData | AbilityData | TraitData | GeneralData;