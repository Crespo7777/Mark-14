// src/features/npc/npc.schema.ts

import { z } from "zod";
import {
  // weaponSchema, // REMOVIDO
  abilitySchema,
  traitSchema,
  inventoryItemSchema,
  simpleUUID,
} from "@/features/character/character.schema";

// ---
// Schema para um item de atributo do NPC
// ---
const attributeItemSchema = z.object({
  value: z.number().default(10),
  note: z.string().default(""), // Campo de anotação
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
// SCHEMA DE COMBATE (Atualizado)
// ---
const npcCombatSchema = z.object({
  toughness_current: z.number().default(10),
  toughness_max: z.number().default(10),
  defense: z.number().default(10),
  armor_rd: z.number().default(0),
  pain_threshold: z.number().default(5), // Adiciona o Limiar de Dor
});

// ---
// SCHEMA DE ARMADURA (Simplificado)
// ---
export const npcArmorSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default("Nova Armadura"),
  protection: z.string().default("0"), // Campo de texto para valor fixo
  quality: z.string().default(""),
});

// ---
// NOVO: Schema de Arma (Simplificado para o NPC)
// ---
export const npcWeaponSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default("Nova Arma"),
  quality: z.string().default(""),
  damage: z.string().default("5"), // Dano agora é um texto/número fixo
  attackAttribute: z.string().default("precise"),
  // projectileId (de personagem) foi removido
  // attribute (de personagem) foi removido
  // quality_desc (de personagem) foi removido
});
// --- FIM DO NOVO ---

// ---
// 3. O SCHEMA PRINCIPAL DO NPC (ATUALIZADO)
// ---
export const npcSheetSchema = z.object({
  // Detalhes Básicos
  name: z.string().min(1, "Nome é obrigatório").default("Novo NPC"),
  race: z.string().default("Criatura"),
  occupation: z.string().default("Monstro"),

  // Atributos (Atualizado para usar o novo schema)
  attributes: npcAttributesSchema.default({}),

  // Combate
  combat: npcCombatSchema.default({}),

  // Reutiliza os schemas
  weapons: z.array(npcWeaponSchema).default([]), // ATUALIZADO
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  armors: z.array(npcArmorSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
});

// ---
// 4. TIPOS E VALORES PADRÃO (ATUALIZADO)
// ---

// Tipos
export type NpcSheetData = z.infer<typeof npcSheetSchema>;
export type NpcArmor = z.infer<typeof npcArmorSchema>;
export type NpcWeapon = z.infer<typeof npcWeaponSchema>; // NOVO TIPO

// Funções Default
export const getDefaultNpcArmor = (): NpcArmor => npcArmorSchema.parse({});
export const getDefaultNpcWeapon = (): NpcWeapon => npcWeaponSchema.parse({}); // NOVA FUNÇÃO
export const getDefaultNpcSheetData = (name: string): NpcSheetData => {
  const defaultData = npcSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};