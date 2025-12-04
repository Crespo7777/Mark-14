// src/types/app-types.ts

import { Database } from "@/integrations/supabase/types";

// Tipo base genérico para tabelas
type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

// Personagem com relação do jogador (Profile)
export type CharacterWithRelations = Tables<"characters"> & {
  player: { display_name: string } | null; // Pode ser null se o utilizador for deletado
  folder_id?: string | null;
  is_archived?: boolean;
};

// NPC (simples, mas preparado para expansão com pastas)
export type NpcWithRelations = Tables<"npcs"> & {
  folder_id?: string | null;
  is_archived?: boolean;
};

// Entrada de Diário com todas as relações possíveis
export type JournalEntryWithRelations = Tables<"journal_entries"> & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
  folder_id?: string | null;
  is_archived?: boolean;
  is_hidden_on_sheet?: boolean; // <--- NOVO CAMPO ADICIONADO
};

// Tipo simples para Pastas
export type FolderType = {
  id: string;
  name: string;
};

// Lojas
export interface Shop {
  id: string;
  table_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

// Itens da Loja
export interface ShopItem {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  weight: number;
  price: number; // Em Ortegas
  quantity: number;
}

// --- NOVO TEMPLATE DE ITEM (Para o Database/Compêndio) ---
export interface ItemTemplate {
  id: string;
  table_id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  // Lista expandida com todas as novas categorias
  category: 
    | 'quality' 
    | 'weapon' 
    | 'armor' 
    | 'ability' 
    | 'trait' 
    | 'consumable' // Elixires
    | 'general'    // Equipamentos
    | 'mount'      // Transporte
    | 'construction'
    | 'service'
    | 'material'
    | 'container'  // Recipientes
    | 'ammunition' // Munições
    | 'animal'     // Animais de Fazenda
    | 'asset'      // Proventos
    | 'clothing'   // Roupas
    | 'tool'       // Ferramenta
    | 'food'       // Comida e bebida
    | 'artifact'   // Artefatos Menores
    | 'trap'       // Armadilhas
    | 'spec_tool'  // Ferramentas Especializadas
    | 'musical';   // Instrumentos Musicais
  weight: number;
  data: any; // JSON flexível para dados específicos
}