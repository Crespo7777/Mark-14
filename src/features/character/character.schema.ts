// src/features/character/character.schema.ts

import { z } from "zod";

export const simpleUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const roundUpDiv = (value: number, divisor: number) => {
  return Math.ceil(value / divisor);
};

// --- SCHEMAS BÁSICOS (Sub-partes da Ficha) ---

// 1. ATRIBUTOS
// (Já começam em 0, está correto)
export const attributesSchema = z.object({
  cunning: z.number().min(0).max(15).default(0),
  discreet: z.number().min(0).max(15).default(0),
  persuasive: z.number().min(0).max(15).default(0),
  precise: z.number().min(0).max(15).default(0),
  quick: z.number().min(0).max(15).default(0),
  resolute: z.number().min(0).max(15).default(0),
  vigilant: z.number().min(0).max(15).default(0),
  vigorous: z.number().min(0).max(15).default(0),
});

// 2. VITALIDADE
// (Começa em 10, que é o valor base mesmo com Vigoroso 0. Está correto)
export const toughnessSchema = z.object({
  bonus: z.number().default(0),
  current: z.number().default(10),
});

// 3. CORRUPÇÃO (Já começa em 0)
export const corruptionSchema = z.object({
  temporary: z.number().default(0),
  permanent: z.number().default(0),
});

// 4. DINHEIRO (Já começa em 0)
export const moneySchema = z.object({
  taler: z.number().default(0),
  shekel: z.number().default(0),
  ortega: z.number().default(0),
});

// 5. EXPERIÊNCIA (Já começa em 0)
export const experienceSchema = z.object({
  total: z.number().default(0),
  spent: z.number().default(0),
});

// 6. ARMAS (Limpar valores padrão)
export const weaponSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""), // <-- MUDADO
  quality: z.string().default(""), // <-- MUDADO
  quality_desc: z.string().default(""),
  damage: z.string().default(""), // <-- MUDADO
  attribute: z.string().default(""), // <-- MUDADO
  attackAttribute: z.string().default(""), // <-- MUDADO
  projectileId: z.string().optional(),
});

// 7. ARMADURAS (Limpar valores padrão)
export const armorSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""), // <-- MUDADO
  quality: z.string().default(""), // <-- MUDADO
  quality_desc: z.string().default(""),
  protection: z.string().default(""), // <-- MUDADO
  obstructive: z.number().default(0),
  equipped: z.boolean().default(true),
});

// 8. HABILIDADES (Limpar valores padrão)
export const abilitySchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  level: z.string().default(""), // <-- MUDADO
  type: z.string().default(""), // <-- MUDADO
  description: z.string().default(""),
  associatedAttribute: z.string().default(""), // <-- MUDADO
  corruptionCost: z.number().default(0),
});

// 9. TRAÇOS (Limpar valores padrão)
export const traitSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  type: z.string().default(""), // <-- MUDADO
  description: z.string().default(""),
});

// 10. INVENTÁRIO (Limpar valores padrão)
export const inventoryItemSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""),
  quantity: z.number().default(1),
  weight: z.number().default(0), // <-- MUDADO (peso padrão 0)
  description: z.string().default(""),
});

// 11. PROJÉTEIS (Limpar valores padrão)
export const projectileSchema = z.object({
  id: z.string().default(() => simpleUUID()),
  name: z.string().default(""), // <-- MUDADO
  quantity: z.number().default(0),
});

// --- TIPOS E FUNÇÕES EXPORTADAS ---

export type Weapon = z.infer<typeof weaponSchema>;
export type Armor = z.infer<typeof armorSchema>;
export type Ability = z.infer<typeof abilitySchema>;
export type Trait = z.infer<typeof traitSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Projectile = z.infer<typeof projectileSchema>;

// Funções para criar itens padrão (agora vêm limpos)
export const getDefaultWeapon = (): Weapon => weaponSchema.parse({});
export const getDefaultArmor = (): Armor => armorSchema.parse({});
export const getDefaultAbility = (): Ability => abilitySchema.parse({});
export const getDefaultTrait = (): Trait => traitSchema.parse({});
export const getDefaultInventoryItem = (): InventoryItem =>
  inventoryItemSchema.parse({});
export const getDefaultProjectile = (): Projectile =>
  projectileSchema.parse({});

// --- O SCHEMA PRINCIPAL (A Ficha Completa) ---

export const characterSheetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").default("Novo Personagem"),
  race: z.string().default("Humano"),
  occupation: z.string().default("Aventureiro"),

  // Campos da aba Detalhes
  shadow: z.string().default(""), 
  personalGoal: z.string().default(""), 
  importantAllies: z.string().default(""), 
  notes: z.string().default(""), // Anotações rápidas

  // 'journal' foi REMOVIDO daqui.

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
  projectiles: z.array(projectileSchema).default([]),
});

export type CharacterSheetData = z.infer<typeof characterSheetSchema>;

// Função para criar uma ficha padrão
export const getDefaultCharacterSheetData = (
  name: string,
): CharacterSheetData => {
  const defaultData = characterSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};