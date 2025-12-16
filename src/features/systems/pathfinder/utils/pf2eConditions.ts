export type ConditionType = "status" | "circumstance" | "item" | "untyped";

export interface ConditionDef {
  slug: string;
  label: string;
  type: ConditionType;
  description: string;
  hasValue: boolean; // Se tem valor numérico (ex: Assustado 1, Assustado 2)
}

export const CONDITIONS_DB: Record<string, ConditionDef> = {
  // --- PENALIDADES DE STATUS (Globais) ---
  frightened: {
    slug: "frightened",
    label: "Assustado (Frightened)",
    type: "status",
    description: "Penalidade de Status em TODOS os testes e CDs.",
    hasValue: true,
  },
  sickened: {
    slug: "sickened",
    label: "Doente (Sickened)",
    type: "status",
    description: "Penalidade de Status em TODOS os testes e CDs. Não pode ingerir nada.",
    hasValue: true,
  },
  
  // --- PENALIDADES ESPECÍFICAS DE ATRIBUTO ---
  enfeebled: {
    slug: "enfeebled",
    label: "Enfraquecido (Enfeebled)",
    type: "status",
    description: "Penalidade de Status em testes baseados em Força (Ataques, Atletismo).",
    hasValue: true,
  },
  clumsy: {
    slug: "clumsy",
    label: "Desajeitado (Clumsy)",
    type: "status",
    description: "Penalidade de Status em testes baseados em Destreza (AC, Reflexos, Ataques à distância).",
    hasValue: true,
  },
  stupefied: {
    slug: "stupefied",
    label: "Estupefato (Stupefied)",
    type: "status",
    description: "Penalidade de Status em Int/Sab/Car e falha ao conjurar magias.",
    hasValue: true,
  },

  // --- CIRCUNSTÂNCIA E ESTADOS ---
  flat_footed: { // Nota: No Remaster chama-se "Off-Guard", mantemos flat-footed por compatibilidade
    slug: "flat_footed",
    label: "Desprevenido (Flat-Footed)",
    type: "circumstance",
    description: "-2 de Circunstância na AC.",
    hasValue: false,
  },
  prone: {
    slug: "prone",
    label: "Caído (Prone)",
    type: "circumstance",
    description: "Está Desprevenido (-2 AC) e tem -2 em Ataques.",
    hasValue: false,
  },
  raised_shield: {
    slug: "raised_shield",
    label: "Escudo Levantado",
    type: "circumstance",
    description: "+2 de Circunstância na AC (depende do escudo, assumimos +2 base).",
    hasValue: false,
  },
};