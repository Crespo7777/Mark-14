import { z } from "zod";

export const simpleUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const roundUpDiv = (value: number, divisor: number) => Math.ceil(value / divisor);

export const numeric = z.union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === "" || val === "-" || val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  });

export const safeString = z.union([z.string(), z.null(), z.undefined()])
  .transform((val) => val || "")
  .default("");

// --- SUB-SCHEMAS ---
export const attributesSchema = z.object({
  cunning: numeric.default(0),
  discreet: numeric.default(0),
  persuasive: numeric.default(0),
  precise: numeric.default(0),
  quick: numeric.default(0),
  resolute: numeric.default(0),
  vigorous: numeric.default(0),
  vigilant: numeric.default(0),
});

export const toughnessSchema = z.object({
  current: numeric.default(10),
  max_modifier: numeric.default(0), 
  temporary: numeric.default(0),
  bonus: numeric.optional().default(0),
});

export const corruptionSchema = z.object({
  temporary: numeric.default(0),
  permanent: numeric.default(0),
  stigma: safeString,
});

export const moneySchema = z.object({
  taler: numeric.default(0),
  shekel: numeric.default(0),
  ortega: numeric.default(0),
});

export const experienceSchema = z.object({
  total: numeric.default(0),
  spent: numeric.default(0),
});

// --- ARMAS E ARMADURAS ---
export const weaponSchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.pipe(z.string().default("Nova Arma")),
  quality: safeString,
  quality_desc: safeString,
  damage: safeString.default("1d4"),
  attribute: safeString,
  attackAttribute: safeString.default("vigorous"),
  projectileId: z.string().optional(),
  weight: numeric.default(1),
  icon_url: z.string().nullable().optional(),
  system_tags: z.array(z.string()).optional().default([]),
});

export const armorSchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.default("Nova Armadura"),
  quality: safeString,
  quality_desc: safeString,
  protection: safeString.default("1d4"),
  obstructive: numeric.default(0),
  equipped: z.boolean().default(true),
  weight: numeric.default(0),
  icon_url: z.string().nullable().optional(),
});

// --- HABILIDADES ---
export const abilitySchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.transform(v => v || "Nova Habilidade").default("Nova Habilidade"),
  level: safeString, 
  type: safeString.default("Habilidade"), 
  description: safeString,
  associatedAttribute: safeString, 
  corruptionCost: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => v ? String(v) : "0")
    .default("0"),
  tradition: safeString,
  isActive: z.boolean().default(false),
  icon_url: z.string().nullable().optional(),
});

// --- TRAÇOS ---
export const traitSchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.default("Novo Traço"),
  type: safeString.default("Traço"),
  level: safeString,
  description: safeString,
  icon_url: z.string().nullable().optional(),
});

// --- INVENTÁRIO ---
export const inventoryItemSchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.default("Novo Item"),
  quantity: numeric.default(1),
  weight: numeric.optional().default(0),
  description: safeString,
  data: z.record(z.any()).optional().default({}),
  icon_url: z.string().nullable().optional(),
});

// --- PROJÉTEIS ---
export const projectileSchema = z.object({
  id: z.string().default(simpleUUID),
  name: safeString.default("Munição"),
  quantity: numeric.default(1),
  weight: numeric.default(0),
  damage: safeString,
  attack_modifier: safeString.default("0"),
  quality: safeString,
  quality_desc: safeString,
  description: safeString,
  icon_url: z.string().nullable().optional(),
});

// --- TIPOS ---
export type Weapon = z.infer<typeof weaponSchema>;
export type Armor = z.infer<typeof armorSchema>;
export type Ability = z.infer<typeof abilitySchema>;
export type Trait = z.infer<typeof traitSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Projectile = z.infer<typeof projectileSchema>;

// --- HELPERS DEFAULT ---
export const getDefaultWeapon = (): Weapon => weaponSchema.parse({});
export const getDefaultArmor = (): Armor => armorSchema.parse({});
export const getDefaultAbility = (): Ability => abilitySchema.parse({});
export const getDefaultTrait = (): Trait => traitSchema.parse({});
export const getDefaultInventoryItem = (): InventoryItem => inventoryItemSchema.parse({});
export const getDefaultProjectile = (): Projectile => projectileSchema.parse({});

// --- SCHEMA PRINCIPAL ---
export const characterSheetSchema = z.object({
  name: safeString.transform(v => v || "Novo Personagem").default("Novo Personagem"),
  race: safeString.default("Humano"),
  occupation: safeString.default("Aventureiro"),
  age: safeString,
  height: safeString,
  weight: safeString,
  shadow: safeString, 
  personalGoal: safeString, 
  importantAllies: safeString, 
  notes: safeString, 
  attributes: attributesSchema.default({}),
  toughness: toughnessSchema.default({}),
  corruption: corruptionSchema.default({}),
  painThresholdBonus: numeric.default(0), 
  money: moneySchema.default({}),
  experience: experienceSchema.default({}),
  weapons: z.array(weaponSchema).default([]),
  armors: z.array(armorSchema).default([]),
  abilities: z.array(abilitySchema).default([]),
  traits: z.array(traitSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
  projectiles: z.array(projectileSchema).default([]),
  image_url: z.string().nullable().optional(), 
  data: z.any().optional(), 
}).passthrough(); 

export type CharacterSheetData = z.infer<typeof characterSheetSchema>;
export type CharacterSchema = CharacterSheetData;

// --- EXPORTAÇÕES QUE FALTAVAM ---
export const getDefaultCharacterSheetData = (name: string): CharacterSheetData => {
  const defaultData = characterSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};

export const defaultCharacterData = characterSheetSchema.parse({});