import { z } from "zod";

// --- HELPERS (Mantidos do teu código original) ---

const numeric = z.union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  });

const proficiencyEnum = z.enum(["U", "T", "E", "M", "L"]).default("U");

// --- NOVOS SUB-SCHEMAS ESTRITOS (Baseados no Livro Básico) ---

const traitSchema = z.string().default(""); // Ex: "Agile, Finesse"

const weaponSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().default("Nova Arma"),
  type: z.enum(["melee", "ranged"]).default("melee"),
  category: z.enum(["unarmed", "simple", "martial", "advanced"]).default("simple"),
  group: z.string().default("sword"), // sword, axe, bow...
  
  damage_dice: numeric.default(1),
  damage_die: z.string().default("d6"), // d4, d6, d8, d10, d12
  damage_type: z.enum(["B", "P", "S"]).default("S"), 
  
  bonus_attack: numeric.default(0), // Runas de Potência (+1, +2...)
  bonus_damage: numeric.default(0), // Runas de Striking ou Especialização
  
  traits: traitSchema,
  range: numeric.default(0), // 0 = Melee
  reload: numeric.default(0), 
  
  hands: z.string().default("1"),
  bulk: z.string().default("L"), 
  quantity: numeric.default(1),
  equipped: z.boolean().default(false), // Importante para calcular ataques ativos
});

const armorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().default("Nova Armadura"),
  category: z.enum(["unarmored", "light", "medium", "heavy", "shield"]).default("unarmored"),
  
  ac_bonus: numeric.default(0),
  dex_cap: numeric.default(99), // 99 = sem limite
  check_penalty: numeric.default(0), // Penalidade em perícias Str/Dex
  speed_penalty: numeric.default(0),
  strength_req: numeric.default(10), 
  
  group: z.string().default("leather"),
  traits: traitSchema,
  
  hardness: numeric.default(0), 
  hp: numeric.default(0),       
  bt: numeric.default(0),       
  
  bulk: z.string().default("1"),
  quantity: numeric.default(1),
  equipped: z.boolean().default(false), // Só soma na AC se true
});

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().default("Item"),
  description: z.string().default(""),
  bulk: z.string().default("L"),
  quantity: numeric.default(1),
  type: z.enum(["gear", "consumable", "treasure"]).default("gear"),
});

// Mantidos os schemas auxiliares que já funcionavam bem
const abilityScoreSchema = z.object({ value: numeric.default(10), temp: numeric.default(0) });
const skillSchema = z.object({ rank: proficiencyEnum, item: numeric.default(0), armor: numeric.default(0), misc: numeric.default(0) });
const spellSchema = z.object({ name: z.string().default(""), level: numeric.default(1), description: z.string().default(""), actions: z.string().default(""), range: z.string().default(""), duration: z.string().default(""), components: z.string().default(""), prepared: z.boolean().default(false), tradition: z.string().default("") });
const actionSchema = z.object({ name: z.string().default(""), type: z.string().default("action"), actions: z.string().default("1"), description: z.string().default(""), traits: z.string().default("") });
const conditionSchema = z.object({ slug: z.string(), value: numeric.default(1), active: z.boolean().default(true) });

// --- SCHEMA PRINCIPAL ATUALIZADO ---

export const pathfinderSchema = z.object({
  // 1. Identidade (Mantido)
  name: z.string().default("Novo Personagem"),
  level: numeric.default(1),
  class: z.string().default(""),
  ancestry: z.string().default(""),
  heritage: z.string().default(""),
  background: z.string().default(""),
  deity: z.string().default(""),
  alignment: z.string().default(""),
  size: z.string().default("Medio"),
  player_name: z.string().default(""),
  
  // 2. Atributos (Mantido)
  abilities: z.object({
    str: abilityScoreSchema.default({}),
    dex: abilityScoreSchema.default({}),
    con: abilityScoreSchema.default({}),
    int: abilityScoreSchema.default({}),
    wis: abilityScoreSchema.default({}),
    cha: abilityScoreSchema.default({}),
  }).default({}),

  // 3. Status Vitais (Mantido)
  hp: z.object({
    current: numeric.default(10), max: numeric.default(10), temp: numeric.default(0), dying: numeric.default(0), wounded: numeric.default(0),
  }).default({}),

  // 4. Atributos Secundários (Mantido)
  attributes: z.object({
    hero_points: numeric.default(1), xp: numeric.default(0),
    class_dc: z.object({ rank: proficiencyEnum, key_attr: z.string().default("str"), item: numeric.default(0), misc: numeric.default(0) }).default({}),
  }).default({}),

  speeds: z.object({
    land: numeric.default(25), fly: numeric.default(0), swim: numeric.default(0), climb: numeric.default(0), burrow: numeric.default(0),
  }).default({}),

  // 5. Defesa (Mantido, mas AC será sobrescrita pela armadura equipada na lógica)
  ac: z.object({
    item: numeric.default(0), shield: numeric.default(0), misc: numeric.default(0), cap: numeric.default(99), rank: proficiencyEnum, 
  }).default({}),

  saves: z.object({
    fortitude: skillSchema.default({}), reflex: skillSchema.default({}), will: skillSchema.default({}),
  }).default({}),

  shield: z.object({
    name: z.string().default(""), hardness: numeric.default(0), hp_max: numeric.default(0), hp_current: numeric.default(0), bt: numeric.default(0), raised: z.boolean().default(false),
  }).default({}),

  proficiencies: z.object({
    unarmed: proficiencyEnum, simple: proficiencyEnum, martial: proficiencyEnum, advanced: proficiencyEnum, light: proficiencyEnum, medium: proficiencyEnum, heavy: proficiencyEnum, unarmored: proficiencyEnum, other: z.string().default(""),
  }).default({}),

  perception: skillSchema.default({}),
  
  // Lista manual de Skills (Mantida)
  skills: z.object({
    acrobatics: skillSchema.default({}), arcana: skillSchema.default({}), athletics: skillSchema.default({}), crafting: skillSchema.default({}), deception: skillSchema.default({}), diplomacy: skillSchema.default({}), intimidation: skillSchema.default({}), medicine: skillSchema.default({}), nature: skillSchema.default({}), occultism: skillSchema.default({}), performance: skillSchema.default({}), religion: skillSchema.default({}), society: skillSchema.default({}), stealth: skillSchema.default({}), survival: skillSchema.default({}), thievery: skillSchema.default({}),
  }).default({}),

  lores: z.array(z.object({ name: z.string(), rank: proficiencyEnum, item: numeric.default(0), misc: numeric.default(0) })).default([]),

  details: z.object({
    languages: z.string().default(""), senses: z.string().default(""), resistances: z.string().default(""), immunities: z.string().default(""), conditions: z.string().default(""), appearance: z.string().default(""), personality: z.string().default(""), attitude: z.string().default(""), beliefs: z.string().default(""), likes: z.string().default(""), dislikes: z.string().default(""), catchphrases: z.string().default(""), gender: z.string().default(""), age: z.string().default(""), height: z.string().default(""), weight: z.string().default(""), ethnicity: z.string().default(""), nationality: z.string().default(""), birthplace: z.string().default(""), pronouns: z.string().default(""),
  }).default({}),

  money: z.object({ pp: numeric.default(0), gp: numeric.default(0), sp: numeric.default(0), cp: numeric.default(0) }).default({}),

  // --- GRANDE MUDANÇA: INVENTÁRIO ESTRUTURADO ---
  inventory: z.object({
    weapons: z.array(weaponSchema).default([]),
    armors: z.array(armorSchema).default([]),
    gear: z.array(itemSchema).default([]),
  }).default({}),

  // Strikes agora podem referenciar armas (para automação futura)
  strikes: z.array(z.any()).default([]), 
  feats: z.array(z.any()).default([]), 
  actions: z.array(actionSchema).default([]),
  active_conditions: z.array(conditionSchema).default([]),
  notes: z.string().default(""),

  spellcasting: z.object({
    key_attribute: z.string().default("intelligence"), proficiency: proficiencyEnum, attack: numeric.default(0), dc: numeric.default(0),
    slotsPerDay: z.record(numeric).default({}), slotsRemaining: z.record(numeric).default({}),
    focusPoints: z.object({ current: numeric.default(0), max: numeric.default(1) }).default({}),
    cantrips: z.array(spellSchema).default([]), spells: z.array(spellSchema).default([]), focusSpells: z.array(spellSchema).default([]), innateSpells: z.array(spellSchema).default([]),
  }).default({}),

}).passthrough(); 

export type PathfinderSheetData = z.infer<typeof pathfinderSchema>;
export const defaultPathfinderData = pathfinderSchema.parse({});