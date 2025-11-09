// src/features/character/character.schema.ts

import { z } from "zod";

// ---
// CORREÇÃO: Adicionado "export" para que outros schemas (como o do NPC) possam usar
// ---
export const simpleUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
// --- FIM DA CORREÇÃO ---


// --- HELPERS (Funções Auxiliares) ---

/**
 * Regra de Symbaroum: Todas as divisões são arredondadas PARA CIMA.
 */
export const roundUpDiv = (value: number, divisor: number) => {
  return Math.ceil(value / divisor);
};

// --- SCHEMAS BÁSICOS (Sub-partes da Ficha) ---

/**
 * 1. ATRIBUTOS
 */
export const attributesSchema = z.object({
  cunning: z.number().min(5).max(15).default(10),
  discreet: z.number().min(5).max(15).default(10),
  persuasive: z.number().min(5).max(15).default(10),
  precise: z.number().min(5).max(15).default(10),
  quick: z.number().min(5).max(15).default(10),
  resolute: z.number().min(5).max(15).default(10),
  vigilant: z.number().min(5).max(15).default(10),
  vigorous: z.number().min(5).max(15).default(10),
});

/**
 * 2. VITALIDADE
 */
export const toughnessSchema = z.object({
  bonus: z.number().default(0),
  current: z.number().default(10),
});

/**
 * 3. CORRUPÇÃO
 */
export const corruptionSchema = z.object({
  temporary: z.number().default(0),
  permanent: z.number().default(0),
});

/**
 * 4. DINHEIRO
 */
export const moneySchema = z.object({
  taler: z.number().default(0),
  shekel: z.number().default(0),
  ortega: z.number().default(0),
});

/**
 * 5. EXPERIÊNCIA
 */
export const experienceSchema = z.object({
  total: z.number().default(0),
  spent: z.number().default(0),
});

/**
 * 6. ARMAS
 */
export const weaponSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default("Nova Arma"),
  quality: z.string().default(""),
  quality_desc: z.string().default(""),
  damage: z.string().default("1d6"),
  attribute: z.string().default("Vigoroso"),
  attackAttribute: z.string().default("precise"),
});

/**
 * 7. ARMADURAS
 */
export const armorSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default("Nova Armadura"),
  quality: z.string().default(""),
  quality_desc: z.string().default(""),
  protection: z.string().default("1d4"),
  obstructive: z.number().default(0),
  equipped: z.boolean().default(true),
});

/**
 * 8. HABILIDADES
 */
export const abilitySchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  level: z.string().default("Novato"),
  type: z.string().default("Habilidade"),
  description: z.string().default(""),
  associatedAttribute: z.string().default("Nenhum"),
  corruptionCost: z.number().default(0),
});

/**
 * 9. TRAÇOS
 */
export const traitSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  type: z.string().default("Traço"),
  description: z.string().default(""),
});

/**
 * 10. INVENTÁRIO
 */
export const inventoryItemSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  quantity: z.number().default(1),
  weight: z.number().default(1),
  description: z.string().default(""),
});

// --- TIPOS E FUNÇÕES EXPORTADAS ---

export type Weapon = z.infer<typeof weaponSchema>;
export type Armor = z.infer<typeof armorSchema>;
export type Ability = z.infer<typeof abilitySchema>;
export type Trait = z.infer<typeof traitSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Funções para criar itens padrão
export const getDefaultWeapon = (): Weapon => weaponSchema.parse({});
export const getDefaultArmor = (): Armor => armorSchema.parse({});
export const getDefaultAbility = (): Ability => abilitySchema.parse({});
export const getDefaultTrait = (): Trait => traitSchema.parse({});
export const getDefaultInventoryItem = (): InventoryItem =>
  inventoryItemSchema.parse({});

// --- O SCHEMA PRINCIPAL (A Ficha Completa) ---

export const characterSheetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").default("Novo Personagem"),
  race: z.string().default("Humano"),
  occupation: z.string().default("Aventureiro"),
  attributes: attributesSchema.default({}),
  toughness: toughnessSchema.default({}),
  corruption: corruptionSchema.default({}),
  money: moneySchema.default({}),
  experience: experienceSchema.default({}),
  weapons: z.array(weaponSchema).default([]),
  armors: z.array(armorSchema).default([]),
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
});

// Este é o tipo TypeScript que usaremos em toda a aplicação
export type CharacterSheetData = z.infer<typeof characterSheetSchema>;

// Função para criar uma ficha padrão
export const getDefaultCharacterSheetData = (
  name: string,
): CharacterSheetData => {
  const defaultData = characterSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};