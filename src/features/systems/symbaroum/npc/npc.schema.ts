import { z } from "zod";
import {
  abilitySchema,
  traitSchema,
  inventoryItemSchema,
  projectileSchema,
  simpleUUID,
  numeric,
} from "@/features/systems/symbaroum/utils/symbaroum.schema";

// Helper para aceitar números negativos e strings vazias
export const signedNumeric = z.union([z.string(), z.number()]).transform((val) => {
  if (val === "" || val === undefined) return 0;
  if (val === "-") return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
});

// --- ATRIBUTOS ---
const attributeItemSchema = z.object({
  value: signedNumeric.default(10), 
  note: z.string().default(""), 
});

const npcAttributesSchema = z.object({
  strong: attributeItemSchema.default({}),
  cunning: attributeItemSchema.default({}),
  discreet: attributeItemSchema.default({}),
  persuasive: attributeItemSchema.default({}),
  precise: attributeItemSchema.default({}),
  quick: attributeItemSchema.default({}),
  resolute: attributeItemSchema.default({}),
  vigilant: attributeItemSchema.default({}),
});

// --- COMBATE ---
const npcCombatSchema = z.object({
  toughness_current: numeric.default(10),
  toughness_max: numeric.default(10),
  
  // --- CORREÇÃO: Estes campos FALTAVAM no seu código original ---
  toughness_temp: numeric.default(0), 
  toughness_max_modifier: signedNumeric.default(0),
  // -------------------------------------------------------------

  temporary: numeric.default(0), 
  defense: signedNumeric.default(0),
  armor_rd: numeric.default(0),
  pain_threshold: numeric.default(5), 
  pain_threshold_bonus: signedNumeric.default(0),
});

// --- ARMADURA ---
export const npcArmorSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default("Nova Armadura"),
  protection: z.string().default("0"),
  obstructive: numeric.default(0), 
  quality: z.string().default(""),
  quality_desc: z.string().default(""), 
  weight: numeric.default(0), 
  equipped: z.boolean().default(true), 
});

// --- ARMA ---
export const npcWeaponSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default("Novo Ataque"),
  damage: z.string().default("1d8"),
  attackAttribute: z.string().default("strong"),
  quality: z.string().default(""),
  quality_desc: z.string().default(""), 
  weight: numeric.default(0), 
  projectileId: z.string().optional(),
});

// --- SCHEMA PRINCIPAL ---
export const npcSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").default("Novo NPC"),
  race: z.string().default("Criatura"),
  occupation: z.string().default("Monstro"),
  image_url: z.string().nullable().optional(), 
  data: z.any().optional(), 

  resistance: z.string().default("Ordinário"),
  tactics: z.string().default(""),
  
  shadow: z.string().default(""), 
  personalGoal: z.string().default(""), 
  importantAllies: z.string().default(""), 
  notes: z.string().default(""),

  attributes: npcAttributesSchema.default({}),
  combat: npcCombatSchema.default({}), // Usa o schema corrigido
  corruption: z.object({
      temporary: numeric.default(0),
      permanent: numeric.default(0),
      stigma: z.string().default(""),
  }).default({}),

  weapons: z.array(npcWeaponSchema).default([]), 
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  armors: z.array(npcArmorSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
  projectiles: z.array(projectileSchema).default([]),

  image_settings: z.object({
    x: z.number().default(50),
    y: z.number().default(50),
    scale: z.number().default(100)
  }).optional(),

}).passthrough();

export type NpcSheetData = z.infer<typeof npcSchema>;
export type NpcArmor = z.infer<typeof npcArmorSchema>;
export type NpcWeapon = z.infer<typeof npcWeaponSchema>; 

export const getDefaultNpcArmor = (): NpcArmor => npcArmorSchema.parse({});
export const getDefaultNpcWeapon = (): NpcWeapon => npcWeaponSchema.parse({}); 

export const getDefaultNpcSheetData = (name: string): NpcSheetData => {
  const defaultData = npcSchema.parse({
    combat: {
        // Inicializa com zeros
        toughness_max_modifier: 0,
        toughness_temp: 0,
        toughness_current: 10,
        toughness_max: 10,
        pain_threshold: 5
    }
  });
  defaultData.name = name;
  return defaultData;
};