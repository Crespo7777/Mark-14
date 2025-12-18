import { 
  Sword, Shield, Zap, Dna, FlaskConical, Backpack, Box, CircleDot, 
  Hammer, Wrench, Shirt, Utensils, PawPrint, Wheat, Castle, Skull, 
  Sparkles, Music, Gem, Star 
} from "lucide-react";

// Mapeamento de chaves
export const ATTRIBUTE_KEYS = {
  STRONG: "strong",
  QUICK: "quick",
  RESOLUTE: "resolute",
  VIGILANT: "vigilant",
  PERSUASIVE: "persuasive",
  CUNNING: "cunning",
  DISCREET: "discreet",
  PRECISE: "precise"
} as const;

// Lista Principal
export const RPG_ATTRIBUTES = [
  { key: ATTRIBUTE_KEYS.STRONG, label: "Vigoroso" }, 
  { key: ATTRIBUTE_KEYS.QUICK, label: "Rápido" },
  { key: ATTRIBUTE_KEYS.RESOLUTE, label: "Resoluto" },
  { key: ATTRIBUTE_KEYS.VIGILANT, label: "Vigilante" },
  { key: ATTRIBUTE_KEYS.PERSUASIVE, label: "Persuasivo" },
  { key: ATTRIBUTE_KEYS.CUNNING, label: "Astuto" },
  { key: ATTRIBUTE_KEYS.DISCREET, label: "Discreto" },
  { key: ATTRIBUTE_KEYS.PRECISE, label: "Preciso" },
];

// --- CORREÇÃO MÁGICA ---
// Exportamos 'attributesList' como um alias para 'RPG_ATTRIBUTES'.
// Isso conserta WeaponCard, AbilityCard e AttributesTab instantaneamente.
export const attributesList = RPG_ATTRIBUTES;
export const ATTRIBUTES = RPG_ATTRIBUTES;

export const SYSTEM_RULES = {
  MIN_HP_THRESHOLD: 10,
  PAIN_THRESHOLD_DIVISOR: 2,
  CORRUPTION_THRESHOLD_DIVISOR: 2,
  ENCUMBRANCE: {
    BASE_LIMIT_ATTRIBUTE: ATTRIBUTE_KEYS.STRONG,
    MIN_LIMIT: 10,
    STATUS: {
      OVERLOADED: "Sobrecarregado",
      HEAVY: "Pesado",
      LIGHT: "Leve"
    }
  },
  LEVELS: {
    NOVICE: "Novato",
    ADEPT: "Adepto",
    MASTER: "Mestre"
  }
};

// Listas do Database (para não quebrar os Forms do Mestre)
export const WEAPON_SUBCATEGORIES = ["Arma de uma Mão", "Arma Curta", "Arma Longa", "Arma Pesada", "Arma de Arremesso", "Arma de Projétil", "Ataque Desarmado", "Escudo"];
export const ARMOR_SUBCATEGORIES = ["Leve", "Média", "Pesada"];
export const CATEGORIES = [
  { id: 'weapon', label: 'Armas', icon: Sword },
  { id: 'armor', label: 'Armaduras', icon: Shield },
  { id: 'ability', label: 'Habilidades', icon: Zap },
  { id: 'trait', label: 'Traços', icon: Dna },
  { id: 'consumable', label: 'Consumíveis', icon: FlaskConical },
  { id: 'general', label: 'Geral', icon: Backpack },
];