// src/features/master/database.schemas.ts
import { z } from "zod";

// Schemas Base
const baseDataSchema = z.object({
  price: z.string().optional(),
});

// Schema de Armas
export const weaponDataSchema = baseDataSchema.extend({
  subcategory: z.string().optional(),
  damage: z.string().min(1, "Dano é obrigatório (ex: 1d8)"),
  attackAttribute: z.string().min(1, "Atributo é obrigatório"),
  quality: z.string().optional(),
  reloadAction: z.string().optional(),
});

// Schema de Armaduras
export const armorDataSchema = baseDataSchema.extend({
  subcategory: z.string().optional(),
  protection: z.string().min(1, "Proteção é obrigatória (use 0 se necessário)"),
  obstructive: z.string().default("0"),
  quality: z.string().optional(),
});

// Schema de Habilidades
export const abilityDataSchema = z.object({
  type: z.enum(["Habilidade", "Poder", "Ritual"]).default("Habilidade"),
  corruptionCost: z.string().optional(),
  associatedAttribute: z.string().optional(),
  tradition: z.string().optional(),
  novice: z.string().min(1, "Efeito Novato é obrigatório"),
  adept: z.string().min(1, "Efeito Adepto é obrigatório"),
  master: z.string().min(1, "Efeito Mestre é obrigatório"),
});

// Schema Genérico (Fallback)
export const generalDataSchema = z.record(z.any());

// Função auxiliar para validar com base na categoria
export const validateItemData = (category: string, data: any) => {
  switch (category) {
    case 'weapon': return weaponDataSchema.safeParse(data);
    case 'armor': return armorDataSchema.safeParse(data);
    case 'ability': return abilityDataSchema.safeParse(data);
    // Adicione outros conforme necessário, ou use o genérico
    default: return generalDataSchema.safeParse(data);
  }
};