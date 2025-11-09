// src/features/npc/npc.schema.ts

import { z } from "zod";
import {
  attributesSchema,
  weaponSchema,
  abilitySchema,
  traitSchema,
  simpleUUID, // Importando o simpleUUID que criamos
} from "@/features/character/character.schema";

// ---
// 1. NOVO SCHEMA DE COMBATE (SIMPLIFICADO PARA O NPC)
// ---
const npcCombatSchema = z.object({
  toughness_current: z.number().default(10),
  toughness_max: z.number().default(10),
  defense: z.number().default(10), 
  armor_rd: z.number().default(0),
});

// ---
// 2. NOVO SCHEMA DE ARMADURA (SIMPLIFICADO PARA O NPC)
// ---
export const npcArmorSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default("Nova Armadura"),
  protection: z.string().default("0"), // Campo de texto para valor fixo
  quality: z.string().default(""),
});
// --- FIM DA ADIÇÃO ---

// ---
// 3. O SCHEMA PRINCIPAL DO NPC (ATUALIZADO)
// ---
export const npcSheetSchema = z.object({
  // Detalhes Básicos
  name: z.string().min(1, "Nome é obrigatório").default("Novo NPC"),
  race: z.string().default("Criatura"),
  occupation: z.string().default("Monstro"),

  // Atributos
  attributes: attributesSchema.default({}),

  // Combate
  combat: npcCombatSchema.default({}),

  // Reutiliza os schemas
  weapons: z.array(weaponSchema).default([]),
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  
  // --- ADICIONADO ---
  armors: z.array(npcArmorSchema).default([]),
  // --- FIM DA ADIÇÃO ---
});

// ---
// 4. TIPOS E VALORES PADRÃO (ATUALIZADO)
// ---

// Tipos
export type NpcSheetData = z.infer<typeof npcSheetSchema>;
export type NpcArmor = z.infer<typeof npcArmorSchema>; // Tipo exportado

// Funções Default
export const getDefaultNpcArmor = (): NpcArmor => npcArmorSchema.parse({}); // Função exportada
export const getDefaultNpcSheetData = (name: string): NpcSheetData => {
  const defaultData = npcSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};