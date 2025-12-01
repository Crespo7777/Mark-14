import { z } from "zod";

// --- HELPERS E FUNÇÕES UTILITÁRIAS ---

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

export const roundUpDiv = (value: number, divisor: number) => {
  return Math.ceil(value / divisor);
};

export const numeric = z.union([z.string(), z.number()]).transform((val) => {
  if (val === "" || val === "-") return 0; 
  const n = Number(val);
  return isNaN(n) ? 0 : n;
});

// --- SUB-SCHEMAS ---

export const attributesSchema = z.object({
  cunning: numeric.default(0),
  discreet: numeric.default(0),
  persuasive: numeric.default(0),
  precise: numeric.default(0),
  quick: numeric.default(0),
  resolute: numeric.default(0),
  vigorous: numeric.default(0), // Nota: Vigorous é o nosso 'Strong' (Forte)
  vigilant: numeric.default(0),
});

// ATUALIZADO: Suporte para Bónus Máximo e Temporário
export const toughnessSchema = z.object({
  current: numeric.default(10),
  max_modifier: numeric.default(0), // Bônus permanente (ex: Robusto)
  temporary: numeric.default(0),    // Vida Temporária (ex: Magia/Escudo)
  // Mantemos 'bonus' opcional para compatibilidade antiga se necessário, mas o código novo usará max_modifier
  bonus: numeric.optional().default(0), 
});

export const corruptionSchema = z.object({
  temporary: numeric.default(0),
  permanent: numeric.default(0),
  stigma: z.string().default(""),
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
  name: z.string().default(""), 
  quality: z.string().default(""), 
  quality_desc: z.string().default(""),
  damage: z.string().default(""), 
  attribute: z.string().default(""), 
  attackAttribute: z.string().default(""), 
  projectileId: z.string().optional(),
  weight: numeric.default(1),
});

export const armorSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""), 
  quality: z.string().default(""), 
  quality_desc: z.string().default(""),
  protection: z.string().default(""), 
  obstructive: numeric.default(0),
  equipped: z.boolean().default(true),
  weight: numeric.default(0),
});

export const abilitySchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""),
  level: z.string().default(""), 
  type: z.string().default(""), 
  description: z.string().default(""),
  associatedAttribute: z.string().default(""), 
  corruptionCost: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
  tradition: z.string().optional().default(""),
  isActive: z.boolean().default(false),
});

export const traitSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""),
  type: z.string().default(""),
  level: z.string().default(""),
  description: z.string().default(""),
});

export const inventoryItemSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""),
  quantity: numeric.default(1),
  weight: numeric.default(0), 
  description: z.string().default(""),
  data: z.record(z.any()).optional().default({}), 
});

export const projectileSchema = z.object({
  id: z.string().default(simpleUUID),
  name: z.string().default(""), 
  quantity: numeric.default(1),
  weight: numeric.default(0),
  damage: z.string().default(""),
  attack_modifier: z.string().default(""),
  quality: z.string().default(""),
  quality_desc: z.string().default(""),
  description: z.string().default(""),
});

// --- TIPOS EXPORTADOS ---
export type Weapon = z.infer<typeof weaponSchema>;
export type Armor = z.infer<typeof armorSchema>;
export type Ability = z.infer<typeof abilitySchema>;
export type Trait = z.infer<typeof traitSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Projectile = z.infer<typeof projectileSchema>;

// --- HELPERS DE DEFAULT ---
export const getDefaultWeapon = (): Weapon => weaponSchema.parse({});
export const getDefaultArmor = (): Armor => armorSchema.parse({});
export const getDefaultAbility = (): Ability => abilitySchema.parse({});
export const getDefaultTrait = (): Trait => traitSchema.parse({});
export const getDefaultInventoryItem = (): InventoryItem => inventoryItemSchema.parse({});
export const getDefaultProjectile = (): Projectile => projectileSchema.parse({});

// --- SCHEMA PRINCIPAL ---

export const characterSheetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").default("Novo Personagem"),
  race: z.string().default("Humano"),
  occupation: z.string().default("Aventureiro"),
  age: z.string().default(""),
  height: z.string().default(""),
  weight: z.string().default(""),
  shadow: z.string().default(""), 
  personalGoal: z.string().default(""), 
  importantAllies: z.string().default(""), 
  notes: z.string().default(""), 
  
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

export const getDefaultCharacterSheetData = (name: string): CharacterSheetData => {
  const defaultData = characterSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};

export const defaultCharacterData = characterSheetSchema.parse({});