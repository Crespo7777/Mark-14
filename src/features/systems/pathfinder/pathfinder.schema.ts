import { z } from "zod";

// --- HELPERS ---

// Helper para garantir que números são tratados corretamente 
// (converte string vazia, null ou undefined para 0)
const numeric = z.union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  });

// Enum de Proficiência (Untrained, Trained, Expert, Master, Legendary)
const proficiencyEnum = z.enum(["U", "T", "E", "M", "L"]).default("U");

// --- SUB-SCHEMAS REUTILIZÁVEIS ---

const abilityScoreSchema = z.object({
  value: numeric.default(10),
  temp: numeric.default(0),
});

const skillSchema = z.object({
  rank: proficiencyEnum,
  item: numeric.default(0),
  armor: numeric.default(0),
  misc: numeric.default(0),
});

// Schema de Magia (para as listas de grimório)
const spellSchema = z.object({
  name: z.string().default(""),
  level: numeric.default(1),
  description: z.string().default(""),
  actions: z.string().default(""),
  range: z.string().default(""),
  duration: z.string().default(""),
  components: z.string().default(""), // V, S, M
  prepared: z.boolean().default(false),
  tradition: z.string().default(""),
});

// Schema para a aba de Ações Táticas
const actionSchema = z.object({
  name: z.string().default(""),
  type: z.string().default("action"), // action, reaction, free, passive
  actions: z.string().default("1"),   // "1", "2", "3" ou texto para reaction
  description: z.string().default(""),
  traits: z.string().default(""),
});

// Schema para Condições Ativas (Automação)
const conditionSchema = z.object({
  slug: z.string(),           // ID único da condição (ex: 'frightened')
  value: numeric.default(1),  // Valor numérico (ex: 1, 2)
  active: z.boolean().default(true)
});

// --- SCHEMA PRINCIPAL DA FICHA ---

export const pathfinderSchema = z.object({
  // 1. Identidade e Informações Básicas
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
  
  // 2. Atributos (Força, Destreza, etc.)
  abilities: z.object({
    str: abilityScoreSchema.default({}),
    dex: abilityScoreSchema.default({}),
    con: abilityScoreSchema.default({}),
    int: abilityScoreSchema.default({}),
    wis: abilityScoreSchema.default({}),
    cha: abilityScoreSchema.default({}),
  }).default({}),

  // 3. Status Vitais
  hp: z.object({
    current: numeric.default(10),
    max: numeric.default(10),
    temp: numeric.default(0),
    dying: numeric.default(0),
    wounded: numeric.default(0),
  }).default({}),

  // 4. Atributos Secundários e Recursos
  attributes: z.object({
    hero_points: numeric.default(1),
    xp: numeric.default(0),
    class_dc: z.object({
        rank: proficiencyEnum,
        key_attr: z.string().default("str"),
        item: numeric.default(0),
        misc: numeric.default(0)
    }).default({}),
  }).default({}),

  speeds: z.object({
    land: numeric.default(25),
    fly: numeric.default(0),
    swim: numeric.default(0),
    climb: numeric.default(0),
    burrow: numeric.default(0),
  }).default({}),

  // 5. Defesa (AC e Saves)
  ac: z.object({
    item: numeric.default(0), 
    shield: numeric.default(0), 
    misc: numeric.default(0),
    cap: numeric.default(99),
    rank: proficiencyEnum, 
  }).default({}),

  saves: z.object({
    fortitude: skillSchema.default({}),
    reflex: skillSchema.default({}),
    will: skillSchema.default({}),
  }).default({}),

  shield: z.object({
    name: z.string().default(""),
    hardness: numeric.default(0),
    hp_max: numeric.default(0),
    hp_current: numeric.default(0),
    bt: numeric.default(0),
    raised: z.boolean().default(false),
  }).default({}),

  // 6. Proficiências de Combate (Genérico)
  proficiencies: z.object({
    unarmed: proficiencyEnum,
    simple: proficiencyEnum,
    martial: proficiencyEnum,
    advanced: proficiencyEnum,
    light: proficiencyEnum,
    medium: proficiencyEnum,
    heavy: proficiencyEnum,
    unarmored: proficiencyEnum,
    other: z.string().default(""),
  }).default({}),

  // 7. Perícias e Sentidos
  perception: skillSchema.default({}),
  
  skills: z.object({
    acrobatics: skillSchema.default({}),
    arcana: skillSchema.default({}),
    athletics: skillSchema.default({}),
    crafting: skillSchema.default({}),
    deception: skillSchema.default({}),
    diplomacy: skillSchema.default({}),
    intimidation: skillSchema.default({}),
    medicine: skillSchema.default({}),
    nature: skillSchema.default({}),
    occultism: skillSchema.default({}),
    performance: skillSchema.default({}),
    religion: skillSchema.default({}),
    society: skillSchema.default({}),
    stealth: skillSchema.default({}),
    survival: skillSchema.default({}),
    thievery: skillSchema.default({}),
  }).default({}),

  lores: z.array(z.object({
      name: z.string(),
      rank: proficiencyEnum,
      item: numeric.default(0),
      misc: numeric.default(0)
  })).default([]),

  // 8. Biografia Detalhada
  details: z.object({
    languages: z.string().default(""),
    senses: z.string().default(""),
    resistances: z.string().default(""),
    immunities: z.string().default(""),
    conditions: z.string().default(""), // Campo de texto livre (legado ou notas)
    appearance: z.string().default(""),
    personality: z.string().default(""),
    attitude: z.string().default(""),
    beliefs: z.string().default(""),
    likes: z.string().default(""),
    dislikes: z.string().default(""),
    catchphrases: z.string().default(""),
    gender: z.string().default(""),
    age: z.string().default(""),
    height: z.string().default(""),
    weight: z.string().default(""),
    ethnicity: z.string().default(""),
    nationality: z.string().default(""),
    birthplace: z.string().default(""),
    pronouns: z.string().default(""),
  }).default({}),

  // 9. Inventário e Economia
  money: z.object({
    pp: numeric.default(0), // Platina
    gp: numeric.default(0), // Ouro
    sp: numeric.default(0), // Prata
    cp: numeric.default(0), // Cobre
  }).default({}),

  // Itens: Usamos z.any() aqui para flexibilidade, mas a UI espera { name, quantity, bulk, type }
  inventory: z.array(z.any()).default([]),

  // 10. Listas de Dados Dinâmicos
  
  // Ataques (Aba Combate)
  strikes: z.array(z.any()).default([]), 
  
  // Talentos (Aba Talentos)
  feats: z.array(z.any()).default([]), 
  
  // Ações Táticas (Aba Ações - NOVO)
  actions: z.array(actionSchema).default([]),
  
  // Condições Ativas (Header/Automação - NOVO)
  active_conditions: z.array(conditionSchema).default([]),
  
  // Notas Gerais
  notes: z.string().default(""),

  // 11. SISTEMA DE MAGIA COMPLETO
  spellcasting: z.object({
    key_attribute: z.string().default("intelligence"), // int, wis, cha
    proficiency: proficiencyEnum,
    attack: numeric.default(0), // Bônus base manual (se houver)
    dc: numeric.default(0),     // Bônus base manual (se houver)
    
    // Slots organizados por nível (Chave numérica: 1 a 10)
    slotsPerDay: z.record(numeric).default({}),
    slotsRemaining: z.record(numeric).default({}),
    
    // Pontos de Foco
    focusPoints: z.object({ 
      current: numeric.default(0), 
      max: numeric.default(1) 
    }).default({}),
    
    // Listas Separadas de Magias
    cantrips: z.array(spellSchema).default([]),
    spells: z.array(spellSchema).default([]),
    focusSpells: z.array(spellSchema).default([]),
    innateSpells: z.array(spellSchema).default([]),
  }).default({}),

}).passthrough(); // Permite campos extras não definidos (útil para migrações futuras)

export type PathfinderSheetData = z.infer<typeof pathfinderSchema>;
export const defaultPathfinderData = pathfinderSchema.parse({});