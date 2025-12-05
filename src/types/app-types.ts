import { Database } from "@/integrations/supabase/types";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type CharacterWithRelations = Tables<"characters"> & {
  player: { display_name: string } | null;
  folder_id?: string | null;
  is_archived?: boolean;
};

export type NpcWithRelations = Tables<"npcs"> & {
  folder_id?: string | null;
  is_archived?: boolean;
};

export type JournalEntryWithRelations = Tables<"journal_entries"> & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
  folder_id?: string | null;
  is_archived?: boolean;
  is_hidden_on_sheet?: boolean;
};

export type FolderType = {
  id: string;
  name: string;
};

export interface Shop {
  id: string;
  table_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface ShopItem {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  weight: number;
  price: number;
  quantity: number;
}

export interface ItemTemplate {
  id: string;
  table_id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  category: 
    | 'quality' | 'weapon' | 'armor' | 'ability' | 'trait' | 'consumable' 
    | 'general' | 'mount' | 'construction' | 'service' | 'material' 
    | 'container' | 'ammunition' | 'animal' | 'asset' | 'clothing' 
    | 'tool' | 'food' | 'artifact' | 'trap' | 'spec_tool' | 'musical';
  weight: number;
  data: any;
}

// --- TIPOS DA MESA (SIMPLIFICADOS) ---

export interface Table {
  id: string;
  name: string;
  description?: string | null;
  master_id: string;
  created_at: string;
  password?: string | null; // Apenas Senha
  image_url?: string | null;
}