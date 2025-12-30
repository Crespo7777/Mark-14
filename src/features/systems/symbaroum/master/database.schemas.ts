import { z } from "zod";

// Schemas Base
const baseDataSchema = z.object({
  price: z.string().optional(),
  weight: z.number().optional().default(0),
});

// Armas (Core p. 152)
export const weaponDataSchema = baseDataSchema.extend({
  subcategory: z.string().optional(),
  damage: z.string().min(1, "Dano é obrigatório"),
  attackAttribute: z.string().min(1, "Atributo é obrigatório"),
  quality: z.string().optional(),
  reloadAction: z.string().optional(),
});

// Armaduras (Core p. 153)
export const armorDataSchema = baseDataSchema.extend({
  subcategory: z.string().optional(),
  protection: z.string().min(1, "Proteção é obrigatória"),
  obstructive: z.string().default("0"),
  quality: z.string().optional(),
});

// Habilidades, Poderes e Rituais UNIFICADOS (Core p. 112, 130, 140)
export const abilityDataSchema = z.object({
  type: z.enum(["Habilidade", "Poder", "Ritual"]).default("Habilidade"),
  
  // Rituais e Poderes têm custo de corrupção e tradição
  corruptionCost: z.string().optional(), 
  tradition: z.string().optional(),
  associatedAttribute: z.string().optional(),

  // Novato é obrigatório (Serve como Descrição única para Rituais)
  novice: z.string().min(1, "Descrição ou Nível Novato é obrigatório"),
  
  // Adepto/Mestre são opcionais (Rituais não usam)
  adept: z.string().optional(),
  master: z.string().optional(),
});

// Traços, Dádivas e Fardos (APG p. 57)
export const traitDataSchema = z.object({
  type: z.enum(["Traço", "Dádiva", "Fardo", "Monstruoso"]).default("Traço"),
  cost: z.string().optional(), // Custo em Pontos/XP
  
  // Novato serve como descrição principal para Dádivas/Fardos
  novice: z.string().min(1, "Descrição é obrigatória"),
  adept: z.string().optional(), 
  master: z.string().optional(),
});

// Qualidades (APG p. 119)
export const qualityDataSchema = z.object({
  type: z.enum(["Mundana", "Mística"]).default("Mundana"),
  targetType: z.string().optional(), // Arma, Armadura, etc.
  costModifier: z.string().optional(), // Custo extra
  effect: z.string().min(1, "Efeito é obrigatório"),
});

// Artefatos (APG p. 112)
export const artifactDataSchema = baseDataSchema.extend({
  corruption: z.string().optional(), // Corrupção por uso
  soulBind: z.string().optional(),   // Custo do Vínculo
  powers: z.string().optional(),     // Poderes descritivos (ou usa o RichText)
  effect: z.string().optional(),     // Efeito resumido
});

// Consumíveis e Alquimia (APG p. 122 - Alquimia de Combate)
export const consumableDataSchema = baseDataSchema.extend({
  uses: z.string().optional(),
  damage: z.string().optional(), // Granadas causam dano
  effect: z.string().min(1, "Efeito é obrigatório"),
});

// Armadilhas (Core p. 177)
export const trapDataSchema = z.object({
  detectDiff: z.string().optional(), // Teste de Vigilante
  disarmDiff: z.string().optional(), // Teste de Astuto
  attackValue: z.string().optional(), // Ataque da armadilha
  damage: z.string().optional(),      // Dano
  effect: z.string().min(1, "Efeito/Gatilho é obrigatório"),
});

// Schema Genérico
export const generalDataSchema = z.record(z.any());

// Validador Principal
export const validateItemData = (category: string, data: any) => {
  switch (category) {
    case 'weapon': return weaponDataSchema.safeParse(data);
    case 'armor': return armorDataSchema.safeParse(data);
    case 'ability': return abilityDataSchema.safeParse(data); // Agora valida Rituais aqui
    case 'trait': return traitDataSchema.safeParse(data);
    case 'quality': return qualityDataSchema.safeParse(data);
    case 'artifact': return artifactDataSchema.safeParse(data);
    case 'consumable': return consumableDataSchema.safeParse(data);
    case 'trap': return trapDataSchema.safeParse(data); // Novo validador
    default: return generalDataSchema.safeParse(data);
  }
};