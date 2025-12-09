// src/features/character/character.constants.ts

// Mapeamento de chaves para evitar strings soltas no código
export const ATTRIBUTES = {
  STRONG: "strong",
  QUICK: "quick",
  RESOLUTE: "resolute",
  VIGILANT: "vigilant",
  PERSUASIVE: "persuasive",
  CUNNING: "cunning",
  DISCREET: "discreet",
  PRECISE: "precise",
  // Aliases (para compatibilidade com dados antigos ou traduções alternativas)
  VIGOROUS: "vigorous" 
} as const;

// Configuração centralizada das Regras do Sistema (Symbaroum)
export const SYSTEM_RULES = {
  // HP e Defesa
  MIN_HP_THRESHOLD: 10,
  PAIN_THRESHOLD_DIVISOR: 2,
  CORRUPTION_THRESHOLD_DIVISOR: 2,
  
  // Carga
  ENCUMBRANCE: {
    BASE_LIMIT_ATTRIBUTE: ATTRIBUTES.STRONG,
    MIN_LIMIT: 10,
    STATUS: {
      OVERLOADED: "Sobrecarregado",
      HEAVY: "Pesado",
      LIGHT: "Leve"
    }
  },

  // Habilidades Especiais (Detetadas por nome)
  ABILITIES: {
    EXCEPTIONAL_ATTRIBUTE: ["atributo excepcional", "exceptional attribute"],
    BERSERK: ["amoque", "berserk"],
    FEAT_OF_STRENGTH: ["façanha de força", "feat of strength"],
    IRON_FIST: ["punhos de ferro", "iron fist"] // Exemplo futuro
  },

  // Níveis de Habilidade
  LEVELS: {
    NOVICE: "Novato",
    ADEPT: "Adepto",
    MASTER: "Mestre"
  }
};

export const attributesList: { key: string; label: string }[] = [
  { key: ATTRIBUTES.CUNNING, label: "Astuto" },
  { key: ATTRIBUTES.DISCREET, label: "Discreto" },
  { key: ATTRIBUTES.PERSUASIVE, label: "Persuasivo" },
  { key: ATTRIBUTES.PRECISE, label: "Preciso" },
  { key: ATTRIBUTES.QUICK, label: "Rápido" },
  { key: ATTRIBUTES.RESOLUTE, label: "Resoluto" },
  { key: ATTRIBUTES.VIGILANT, label: "Vigilante" },
  { key: ATTRIBUTES.VIGOROUS, label: "Vigoroso" }, // Mantivemos o label original, mas a chave agora é gerida
];