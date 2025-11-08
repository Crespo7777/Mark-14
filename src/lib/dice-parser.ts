// src/lib/dice-parser.ts

/**
 * Interface simples para o resultado da rolagem
 */
interface DiceRoll {
  rolls: number[];
  modifier: number;
  total: number;
}

/**
 * Regex para capturar "XdY+Z" ou "XdY-Z" ou "XdY"
 * G1: X (número de dados)
 * G2: Y (lados do dado)
 * G3: + ou - (operador)
 * G4: Z (modificador)
 */
const diceRegex = /(\d+)[dD](\d+)(?:([+\-])(\d+))?/;

/**
 * Rola um único dado
 * @param sides - Número de lados
 * @returns um número entre 1 e 'sides'
 */
const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Analisa uma string de rolagem (ex: "2d6+3") e retorna o resultado
 * @param command - A string de rolagem (sem o "/r ")
 * @returns Um objeto DiceRoll ou null se a string for inválida
 */
export const parseDiceRoll = (command: string): DiceRoll | null => {
  const match = command.trim().match(diceRegex);

  if (!match) {
    return null;
  }

  const numDice = parseInt(match[1], 10);
  const dieSides = parseInt(match[2], 10);
  const operator = match[3];
  const modifier = match[4] ? parseInt(match[4], 10) : 0;

  // Limites para evitar abuso (ex: 999d999)
  if (numDice > 100 || dieSides > 1000) {
    return null;
  }

  const rolls: number[] = [];
  let subTotal = 0;
  for (let i = 0; i < numDice; i++) {
    const roll = rollDie(dieSides);
    rolls.push(roll);
    subTotal += roll;
  }

  const total = operator === "-" ? subTotal - modifier : subTotal + modifier;
  const finalModifier = operator === "-" ? -modifier : modifier;

  return {
    rolls,
    modifier: finalModifier,
    total,
  };
};

/**
 * Formata o resultado da rolagem para uma string amigável
 * @param command - A string de rolagem original (ex: "2d6+3")
 * @param result - O objeto DiceRoll
 * @returns Uma string formatada (ex: "Rolou 2d6+3... [5, 2] + 3 = 10")
 */
export const formatRollResult = (command: string, result: DiceRoll): string => {
  const rollsStr = `[${result.rolls.join(", ")}]`;
  const modStr =
    result.modifier > 0
      ? ` + ${result.modifier}`
      : result.modifier < 0
      ? ` - ${Math.abs(result.modifier)}`
      : "";

  return `Rolou ${command}...\n${rollsStr}${modStr} = **${result.total}**`;
};