// src/features/npc/npc.schema.ts

import { z } from "zod";
import {
  abilitySchema,
  traitSchema,
  inventoryItemSchema,
  simpleUUID,
  numeric, // <-- IMPORTADO
} from "@/features/character/character.schema";

// ---
// Schema para um item de atributo do NPC
// ---
const attributeItemSchema = z.object({
  value: numeric.default(0), // <-- NUMERIC
  note: z.string().default(""), 
});

// ---
// Schema de Atributos específico para o NPC
// ---
const npcAttributesSchema = z.object({
  cunning: attributeItemSchema.default({}),
  discreet: attributeItemSchema.default({}),
  persuasive: attributeItemSchema.default({}),
  precise: attributeItemSchema.default({}),
  quick: attributeItemSchema.default({}),
  resolute: attributeItemSchema.default({}),
  vigilant: attributeItemSchema.default({}),
  vigorous: attributeItemSchema.default({}),
});

// ---
// SCHEMA DE COMBATE
// ---
const npcCombatSchema = z.object({
  toughness_current: numeric.default(0), // <-- NUMERIC
  toughness_max: numeric.default(0),     // <-- NUMERIC
  defense: numeric.default(0),           // <-- NUMERIC
  armor_rd: numeric.default(0),          // <-- NUMERIC
  pain_threshold: numeric.default(0),    // <-- NUMERIC
  pain_threshold_bonus: numeric.default(0), // <-- NUMERIC
});

// ---
// SCHEMA DE ARMADURA (Simplificado)
// ---
export const npcArmorSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""),
  protection: z.string().default(""),
  quality: z.string().default(""),
});

// ---
// Schema de Arma (Simplificado para o NPC)
// ---
export const npcWeaponSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""),
  quality: z.string().default(""),
  damage: z.string().default(""),
  attackAttribute: z.string().default(""),
});

// ---
// 3. O SCHEMA PRINCIPAL DO NPC
// ---
export const npcSheetSchema = z.object({
  // Detalhes Básicos
  name: z.string().min(1, "Nome é obrigatório").default("Novo NPC"),
  race: z.string().default("Criatura"),
  occupation: z.string().default("Monstro"),

  // Campos da aba Detalhes
  shadow: z.string().default(""), 
  personalGoal: z.string().default(""), 
  importantAllies: z.string().default(""), 
  notes: z.string().default(""),

  // Atributos
  attributes: npcAttributesSchema.default({}),

  // Combate
  combat: npcCombatSchema.default({}),

  // --- CORRUPÇÃO ---
  corruption: z.object({
      temporary: numeric.default(0), // <-- NUMERIC
      permanent: numeric.default(0), // <-- NUMERIC
      stigma: z.string().default(""),
  }).default({}),

  // Reutiliza os schemas
  weapons: z.array(npcWeaponSchema).default([]), 
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  armors: z.array(npcArmorSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
});

// Tipos e Valores Padrão
export type NpcSheetData = z.infer<typeof npcSheetSchema>;
export type NpcArmor = z.infer<typeof npcArmorSchema>;
export type NpcWeapon = z.infer<typeof npcWeaponSchema>; 

export const getDefaultNpcArmor = (): NpcArmor => npcArmorSchema.parse({});
export const getDefaultNpcWeapon = (): NpcWeapon => npcWeaponSchema.parse({}); 
export const getDefaultNpcSheetData = (name: string): NpcSheetData => {
  const defaultData = npcSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};