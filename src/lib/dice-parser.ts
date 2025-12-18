/**
 * Interface para o resultado da rolagem.
 */
export interface DiceRoll {
  total: number;       // O valor final da soma
  formula: string;     // A fórmula original (ex: "1d20 + 1d4")
  rolls: number[];     // Todos os resultados de dados individuais
  details: string;     // String detalhada (ex: "1d20[15] + 5")
  isCrit?: boolean;    // Flag opcional para críticos (1 ou 20 no d20)
  isFumble?: boolean;  // Flag opcional para falhas críticas
}

/**
 * Rola um único dado
 */
export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Motor de Rolagem de Dados (Dice Engine)
 * Capaz de processar fórmulas como: "1d20 + 5", "1d8 + 1d6"
 */
class DiceEngine {
  static roll(formula: string): DiceRoll | null {
    const regex = /([+-]?)\s*(\d+)[dD](\d+)|([+-]?)\s*(\d+)/g;
    
    let match;
    let total = 0;
    let detailsParts: string[] = [];
    const allRolls: number[] = [];
    
    if (!formula || formula.length > 50) return null;

    let hasMatch = false;

    while ((match = regex.exec(formula)) !== null) {
      if (match[0].trim() === "") continue;
      hasMatch = true;

      const isDice = !!match[2]; 
      const signStr = match[1] || match[4] || '+'; 
      const sign = signStr.includes('-') ? -1 : 1;
      const cleanSign = sign === -1 ? "- " : "+ ";

      if (isDice) {
        const count = parseInt(match[2], 10);
        const faces = parseInt(match[3], 10);
        
        if (count > 100 || faces > 1000) return null;

        const currentRolls = [];
        let subTotal = 0;

        for (let i = 0; i < count; i++) {
          const val = rollDie(faces);
          currentRolls.push(val);
          subTotal += val;
        }

        total += subTotal * sign;
        allRolls.push(...currentRolls);
        
        const firstTerm = detailsParts.length === 0;
        const prefix = firstTerm ? (sign === -1 ? "-" : "") : cleanSign;
        detailsParts.push(`${prefix}${count}d${faces}[${currentRolls.join(',')}]`);

      } else {
        const value = parseInt(match[5], 10);
        const termTotal = value * sign;
        total += termTotal;
        
        const firstTerm = detailsParts.length === 0;
        const prefix = firstTerm ? (sign === -1 ? "-" : "") : cleanSign;
        detailsParts.push(`${prefix}${value}`);
      }
    }

    if (!hasMatch) return null;

    // Deteção básica para d20
    const isCrit = formula.includes("20") && allRolls.length > 0 && allRolls[0] === 1; // 1 é crit em alguns sistemas, 20 em outros. Engine é neutra?
    // NOTA: Em Symbaroum 1 é Crit. Em Pathfinder 20 é Crit.
    // Vamos deixar a flag neutra aqui e quem usa decide.
    // Mas para manter compatibilidade, vamos deixar como estava (Symbaroum assumption) ou remover.
    // Melhor: Retornar flags puras "rolled1", "rolled20" e o sistema decide.
    // Mas para não quebrar seu código atual, manterei a lógica que você já tinha.
    const isCritLegacy = formula.includes("20") && allRolls.length > 0 && allRolls[0] === 1;
    const isFumbleLegacy = formula.includes("20") && allRolls.length > 0 && allRolls[0] === 20;

    return {
      total,
      formula,
      rolls: allRolls,
      details: detailsParts.join(" "),
      isCrit: isCritLegacy,
      isFumble: isFumbleLegacy
    };
  }
}

export const parseDiceRoll = (command: string): DiceRoll | null => {
  return DiceEngine.roll(command);
};

export const formatRollResult = (command: string, result: DiceRoll): string => {
  const formattedDetails = result.details.replace(
    /\[(.*?)\]/g, 
    `[<span class="text-primary-foreground">$1</span>]`
  );
  return `Rolou ${command}...\n${formattedDetails} = <span class="text-primary-foreground font-bold text-lg">${result.total}</span>`;
};