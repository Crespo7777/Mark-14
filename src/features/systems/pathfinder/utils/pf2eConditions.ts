import { 
  AlertTriangle, 
  ShieldAlert, 
  HeartCrack, 
  Footprints, 
  BrainCircuit, 
  Activity, 
  Shield, 
  Ghost 
} from "lucide-react";

export type ConditionType = "status" | "circumstance" | "item" | "untyped";

export interface ConditionDef {
  slug: string;
  label: string;
  type: ConditionType;
  desc: string;
  hasValue: boolean;
  icon: any;
  color: string;
}

export const CONDITIONS_DB: Record<string, ConditionDef> = {
  frightened: {
    slug: "frightened",
    label: "Assustado (Frightened)",
    type: "status",
    desc: "Penalidade de Status em TODOS os testes e CDs.",
    hasValue: true,
    icon: Ghost,
    color: "text-yellow-600 border-yellow-200 bg-yellow-50"
  },
  sickened: {
    slug: "sickened",
    label: "Doente (Sickened)",
    icon: HeartCrack,
    type: "status",
    desc: "Penalidade de Status em TODOS os testes. Não pode ingerir nada.",
    hasValue: true,
    color: "text-green-600 border-green-200 bg-green-50"
  },
  enfeebled: {
    slug: "enfeebled",
    label: "Enfraquecido (Enfeebled)",
    type: "status",
    desc: "Penalidade de Status em testes baseados em Força.",
    hasValue: true,
    icon: Activity,
    color: "text-red-600 border-red-200 bg-red-50"
  },
  clumsy: {
    slug: "clumsy",
    label: "Desajeitado (Clumsy)",
    type: "status",
    desc: "Penalidade de Status em testes baseados em Destreza e AC.",
    hasValue: true,
    icon: Activity,
    color: "text-slate-600 border-slate-200 bg-slate-50"
  },
  stupefied: {
    slug: "stupefied",
    label: "Estupefato (Stupefied)",
    type: "status",
    desc: "Penalidade de Status em Int/Sab/Car e falha ao conjurar magias.",
    hasValue: true,
    icon: BrainCircuit,
    color: "text-purple-600 border-purple-200 bg-purple-50"
  },
  flat_footed: { 
    slug: "flat_footed",
    label: "Desprevenido (Flat-Footed)",
    type: "circumstance",
    desc: "-2 de Circunstância na AC.",
    hasValue: false,
    icon: ShieldAlert,
    color: "text-blue-600 border-blue-200 bg-blue-50"
  },
  prone: {
    slug: "prone",
    label: "Caído (Prone)",
    type: "circumstance",
    desc: "Flat-footed (-2 AC) e -2 em Ataques.",
    hasValue: false,
    icon: Footprints,
    color: "text-orange-600 border-orange-200 bg-orange-50"
  },
  raised_shield: {
    slug: "raised_shield",
    label: "Escudo Levantado",
    type: "circumstance",
    desc: "+2 de Circunstância na AC.",
    hasValue: false,
    icon: Shield,
    color: "text-indigo-600 border-indigo-200 bg-indigo-50"
  },
};