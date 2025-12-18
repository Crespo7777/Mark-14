import { 
  Sword, Shield, Zap, Dna, FlaskConical, Backpack, Box, CircleDot, 
  Hammer, Wrench, Shirt, Utensils, PawPrint, Wheat, Castle, Skull, 
  Sparkles, Music, Gem, Star 
} from "lucide-react";

// CORREÇÃO CRÍTICA: Mapeamento Chave (Sistema) <-> Nome (Visual)
export const RPG_ATTRIBUTES = [
    { key: "cunning", label: "Astuto" },
    { key: "discreet", label: "Discreto" },
    { key: "persuasive", label: "Persuasivo" },
    { key: "precise", label: "Preciso" },
    { key: "quick", label: "Rápido" },
    { key: "resolute", label: "Resoluto" },
    { key: "vigilant", label: "Vigilante" },
    { key: "vigorous", label: "Vigoroso" } // ou 'strong' se preferires manter compatibilidade total
];

export const WEAPON_SUBCATEGORIES = ["Arma de uma Mão", "Arma Curta", "Arma Longa", "Arma Pesada", "Arma de Arremesso", "Arma de Projétil", "Ataque Desarmado", "Escudo", "Armas de Cerco"];
export const ARMOR_SUBCATEGORIES = ["Leve", "Média", "Pesada"];
export const FOOD_SUBCATEGORIES = ["Bebidas", "Carne", "Chás", "Ensopados", "Mingau", "Peixe", "Sobremesas", "Sopas", "Tortas"];

export const CATEGORIES = [
  { id: 'quality', label: 'Qualidades', icon: Star },
  { id: 'weapon', label: 'Armas', icon: Sword },
  { id: 'armor', label: 'Armaduras', icon: Shield },
  { id: 'ability', label: 'Habilidades', icon: Zap },
  { id: 'trait', label: 'Traços & Dádivas', icon: Dna },
  { id: 'consumable', label: 'Elixires', icon: FlaskConical },
  { id: 'ammunition', label: 'Munições', icon: CircleDot }, 
  { id: 'artifact', label: 'Artefatos', icon: Sparkles },
  { id: 'general', label: 'Equipamentos', icon: Backpack },
  { id: 'container', label: 'Recipientes', icon: Box },
  { id: 'tool', label: 'Ferramenta', icon: Hammer },
  { id: 'spec_tool', label: 'Especializadas', icon: Wrench },
  { id: 'clothing', label: 'Roupas', icon: Shirt },
  { id: 'food', label: 'Comida', icon: Utensils },
  { id: 'mount', label: 'Transporte', icon: PawPrint },
  { id: 'animal', label: 'Animais', icon: Wheat },
  { id: 'construction', label: 'Construções', icon: Castle },
  { id: 'trap', label: 'Armadilhas', icon: Skull },
  { id: 'musical', label: 'Instrumentos', icon: Music },
  { id: 'material', label: 'Materiais', icon: Gem },
];