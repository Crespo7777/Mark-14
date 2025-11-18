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
};

// Tipo simples para Pastas
export type FolderType = {
  id: string;
  name: string;
};