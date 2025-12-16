export type DegreeOfSuccess = "crit-success" | "success" | "failure" | "crit-failure";

export interface RollResult {
  total: number;
  die: number;
  modifier: number;
  bonusBreakdown?: string; // Ex: "4 (For) + 2 (Treinado)"
  degree?: DegreeOfSuccess;
  label: string;
  type: "skill" | "attack" | "save" | "flat";
  dc?: number;
}

/**
 * Calcula o Grau de Sucesso conforme as regras oficiais do PF2e.
 * Regra: Nat 20 sobe um degrau, Nat 1 desce um degrau.
 * Regra: Diferença de +/- 10 ajusta o degrau.
 */
const calculateDegree = (total: number, dc: number, die: number): DegreeOfSuccess => {
  let degree: number; // 3: Crit Suc, 2: Suc, 1: Fail, 0: Crit Fail

  // 1. Determinar o grau base pela diferença numérica
  if (total >= dc + 10) degree = 3;
  else if (total >= dc) degree = 2;
  else if (total <= dc - 10) degree = 0;
  else degree = 1;

  // 2. Ajustar por Natural 20 ou Natural 1
  if (die === 20) {
    degree = Math.min(3, degree + 1); // Sobe 1 grau (max Crítico)
  } else if (die === 1) {
    degree = Math.max(0, degree - 1); // Desce 1 grau (min Falha Crítica)
  }

  // 3. Converter número para string
  switch (degree) {
    case 3: return "crit-success";
    case 2: return "success";
    case 1: return "failure";
    default: return "crit-failure";
  }
};

/**
 * Função Principal de Rolagem
 */
export const rollCheck = (
  modifier: number, 
  label: string, 
  type: RollResult['type'] = "skill", 
  dc?: number
): RollResult => {
  const die = Math.floor(Math.random() * 20) + 1; // 1d20
  const total = die + modifier;

  let degree: DegreeOfSuccess | undefined = undefined;
  if (dc !== undefined) {
    degree = calculateDegree(total, dc, die);
  }

  return {
    die,
    modifier,
    total,
    degree,
    label,
    type,
    dc
  };
};