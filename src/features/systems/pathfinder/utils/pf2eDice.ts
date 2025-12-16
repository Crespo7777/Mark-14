export type DegreeOfSuccess = "crit-success" | "success" | "failure" | "crit-failure";

export interface RollResult {
  total: number;
  die: number; // No dano, pode ser 0 ou a soma dos dados
  modifier: number;
  bonusBreakdown?: string; 
  degree?: DegreeOfSuccess;
  label: string;
  type: "skill" | "attack" | "save" | "flat" | "damage"; // Adicionado "damage"
  dc?: number;
  formula?: string; // Ex: "1d8+4"
}

// ... (calculateDegree mantém-se igual ao teu) ...
const calculateDegree = (total: number, dc: number, die: number): DegreeOfSuccess => {
  let degree: number; 
  if (total >= dc + 10) degree = 3;
  else if (total >= dc) degree = 2;
  else if (total <= dc - 10) degree = 0;
  else degree = 1;

  if (die === 20) degree = Math.min(3, degree + 1);
  else if (die === 1) degree = Math.max(0, degree - 1);

  switch (degree) {
    case 3: return "crit-success";
    case 2: return "success";
    case 1: return "failure";
    default: return "crit-failure";
  }
};

export const rollCheck = (
  modifier: number, 
  label: string, 
  type: RollResult['type'] = "skill", 
  dc?: number
): RollResult => {
  const die = Math.floor(Math.random() * 20) + 1;
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

/**
 * Funçao auxiliar para rolar dano (exportada para uso no Context)
 */
export const calculateDamage = (expression: string, label: string): RollResult => {
    // Parser simples: "1d8+4"
    const parts = expression.toLowerCase().split('+');
    let total = 0;
    const breakdown: string[] = [];

    parts.forEach(part => {
        part = part.trim();
        if (part.includes('d')) {
            const [countStr, facesStr] = part.split('d');
            const count = parseInt(countStr) || 1;
            const faces = parseInt(facesStr) || 6;
            
            let subTotal = 0;
            const rolls = [];
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * faces) + 1;
                subTotal += roll;
                rolls.push(roll);
            }
            total += subTotal;
            breakdown.push(`[${rolls.join(',')}]`);
        } else {
            const num = parseInt(part);
            if (!isNaN(num)) {
                total += num;
                breakdown.push(`${num}`);
            }
        }
    });

    return {
        total,
        die: 0,
        modifier: 0,
        label: `${label}`,
        type: "damage",
        formula: expression,
        bonusBreakdown: breakdown.join(' + ')
    };
};