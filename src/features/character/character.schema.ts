// src/features/character/character.schema.ts

import { z } from "zod";

// --- HELPERS (Funções Auxiliares) ---

/**
 * Regra de Symbaroum: Todas as divisões são arredondadas PARA CIMA.
 * @param value O valor a ser dividido
 * @param divisor O divisor
 * @returns O resultado arredondado para cima.
 */
export const roundUpDiv = (value: number, divisor: number) => {
  return Math.ceil(value / divisor);
};

// --- SCHEMAS BÁSICOS (Sub-partes da Ficha) ---

/**
 * 1. ATRIBUTOS
 */
const attributesSchema = z.object({
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
const toughnessSchema = z.object({
  bonus: z.number().default(0),
  current: z.number().default(10),
});

/**
 * 3. CORRUPÇÃO
 */
const corruptionSchema = z.object({
  temporary: z.number().default(0),
  permanent: z.number().default(0),
});

/**
 * 4. DINHEIRO
 */
const moneySchema = z.object({
  taler: z.number().default(0),
  shekel: z.number().default(0),
  ortega: z.number().default(0),
});

/**
 * 5. EXPERIÊNCIA
 */
const experienceSchema = z.object({
  total: z.number().default(0),
  spent: z.number().default(0),
});

/**
 * 6. ARMAS (ATUALIZADO)
 */
export const weaponSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().default("Nova Arma"),
  quality: z.string().default(""),
  quality_desc: z.string().default(""),
  damage: z.string().default("1d6"),
  attribute: z.string().default("Vigoroso"), // Para Dano
  // --- NOVO CAMPO ---
  attackAttribute: z.string().default("precise"), // Para Ataque (ex: "precise" ou "vigorous")
  // --- FIM DO NOVO CAMPO ---
});

/**
 * 7. ARMADURAS
 */
export const armorSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
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
  id: z.string().default(() => crypto.randomUUID()),
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
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().default(""),
  type: z.string().default("Traço"),
  description: z.string().default(""),
});

/**
 * 10. INVENTÁRIO
 */
export const inventoryItemSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
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
  // 1. Detalhes Básicos
  name: z.string().min(1, "Nome é obrigatório").default("Novo Personagem"),
  race: z.string().default("Humano"),
  occupation: z.string().default("Aventureiro"),

  // 2. Atributos
  attributes: attributesSchema.default({}),

  // 3. Vitalidade
  toughness: toughnessSchema.default({}),

  // 4. Corrupção
  corruption: corruptionSchema.default({}),

  // 5. Dinheiro
  money: moneySchema.default({}),

  // 6. Experiência
  experience: experienceSchema.default({}),

  // 7. Armas
  weapons: z.array(weaponSchema).default([]),

  // 8. Armaduras
  armors: z.array(armorSchema).default([]),

  // 9. Habilidades
  abilities: z.array(abilitySchema).default([]),

  // 10. Traços
  traits: z.array(traitSchema).default([]),

  // 11. Inventário
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