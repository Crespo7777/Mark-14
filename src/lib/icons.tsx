// src/lib/icons.tsx

import React from "react";
import {
  Book,
  Sword,
  Shield,
  Scroll,
  Map,
  MapPin,
  TreasureChest, // Este import está correto
  Skull,
  Building,
  User,
  Sparkles,
  Mountain,
  TreeDeciduous,
  Anchor,
  Key,
  Gem,
  Coins,
  Backpack,
  AlertTriangle,
  Heart,
  Zap,
} from "lucide-react";

// 1. O mapa que associa um nome a um componente
const iconMap: Record<string, React.ElementType> = {
  book: Book,
  sword: Sword,
  shield: Shield,
  scroll: Scroll,
  map: Map,
  pin: MapPin,
  treasure: TreasureChest,
  skull: Skull,
  building: Building,
  user: User,
  sparkles: Sparkles,
  mountain: Mountain,
  tree: TreeDeciduous,
  anchor: Anchor,
  key: Key,
  gem: Gem,
  coins: Coins,
  backpack: Backpack,
  alert: AlertTriangle,
  heart: Heart,
  zap: Zap,
};

// 2. A lista de ícones para o nosso seletor (Picker)
export const iconList = [
  { name: "book", label: "Livro", icon: <Book className="w-4 h-4" /> },
  { name: "sword", label: "Espada", icon: <Sword className="w-4 h-4" /> },
  { name: "shield", label: "Escudo", icon: <Shield className="w-4 h-4" /> },
  { name: "scroll", label: "Pergaminho", icon: <Scroll className="w-4 h-4" /> },
  { name: "map", label: "Mapa", icon: <Map className="w-4 h-4" /> },
  { name: "pin", label: "Local", icon: <MapPin className="w-4 h-4" /> },
  { name: "treasure", label: "Tesouro", icon: <TreasureChest className="w-4 h-4" /> },
  { name: "skull", label: "Caveira", icon: <Skull className="w-4 h-4" /> },
  { name: "building", label: "Edifício", icon: <Building className="w-4 h-4" /> },
  { name: "user", label: "Pessoa", icon: <User className="w-4 h-4" /> },
  { name: "sparkles", label: "Magia", icon: <Sparkles className="w-4 h-4" /> },
  { name: "mountain", label: "Montanha", icon: <Mountain className="w-4 h-4" /> },
  { name: "tree", label: "Árvore", icon: <TreeDeciduous className="w-4 h-4" /> },
  { name: "anchor", label: "Porto", icon: <Anchor className="w-4 h-4" /> },
  { name: "key", label: "Chave", icon: <Key className="w-4 h-4" /> },
  { name: "gem", label: "Gema", icon: <Gem className="w-4 h-4" /> },
  { name: "coins", label: "Dinheiro", icon: <Coins className="w-4 h-4" /> },
  { name: "backpack", label: "Mochila", icon: <Backpack className="w-4 h-4" /> },
  { name: "alert", label: "Alerta", icon: <AlertTriangle className="w-4 h-4" /> },
  // --- CORREÇÃO DE TYPO AQUI ---
  { name: "heart", label: "Coração", icon: <Heart className="w-4 h-4" /> },
  // --- FIM DA CORREÇÃO ---
  { name: "zap", label: "Energia", icon: <Zap className="w-4 h-4" /> },
];

// 3. Componente que renderiza o ícone pelo nome
export const DynamicIcon = ({ name }: { name: string }) => {
  const Icon = iconMap[name];
  if (!Icon) {
    return null;
  }
  return <Icon className="w-4 h-4 inline-block align-text-bottom mx-1" />;
};