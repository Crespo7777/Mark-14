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
export const rollDie = (sides: number): number => {
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
  // ATUALIZADO: Adiciona classes do Tailwind para alto contraste
  const rollsStr = `[<span class="text-primary-foreground">${result.rolls.join(
    ", ",
  )}</span>]`;
  const modStr =
    result.modifier > 0
      ? ` + <span class="text-primary-foreground">${result.modifier}</span>`
      : result.modifier < 0
      ? ` - <span class="text-primary-foreground">${Math.abs(
          result.modifier,
        )}</span>`
      : "";

  return `Rolou ${command}...\n${rollsStr}${modStr} = <span class="text-primary-foreground font-bold text-lg">${result.total}</span>`;
};

// --- NOVAS FUNÇÕES PARA TESTE DE ATRIBUTO ---

/**
 * Resultado de um teste de atributo de Symbaroum
 */
export interface AttributeRollResult {
  mainRoll: number;
  advantageRoll: number | null;
  modifier: number;
  totalRoll: number;
  target: number;
  isSuccess: boolean;
  isCrit: boolean;
  isFumble: boolean;
}

/**
 * Executa uma rolagem de atributo (1d20) contra um alvo.
 */
export const rollAttributeTest = (options: {
  attributeValue: number;
  modifier: number;
  withAdvantage: boolean;
}): AttributeRollResult => {
  const { attributeValue, modifier, withAdvantage } = options;

  const mainRoll = rollDie(20);
  const advantageRoll = withAdvantage ? rollDie(4) : null;

  // Em Symbaroum, o modificador se aplica ao *Atributo* (Alvo),
  // mas a Vantagem (+1d4) se aplica à *Rolagem*.
  const target = attributeValue + modifier;
  const totalRoll = mainRoll + (advantageRoll || 0);

  // Regras de sucesso: rolar *igual ou menor* que o alvo.
  const isSuccess = totalRoll <= target;
  // 1 é sempre um sucesso crítico (independentemente do alvo).
  const isCrit = mainRoll === 1;
  // 20 é sempre uma falha (independentemente do alvo).
  const isFumble = mainRoll === 20;

  return {
    mainRoll,
    advantageRoll,
    modifier,
    totalRoll,
    target,
    isSuccess: (isSuccess && !isFumble) || isCrit,
    isCrit,
    isFumble,
  };
};

/**
 * Formata um resultado de teste de atributo para o chat.
 */
export const formatAttributeTest = (
  characterName: string,
  attributeName: string,
  result: AttributeRollResult,
): string => {
  const {
    mainRoll,
    advantageRoll,
    modifier,
    totalRoll,
    target,
    isSuccess,
    isCrit,
    isFumble,
  } = result;

  // ATUALIZADO: Define classes de cor com base nos tokens do Tailwind
  let outcomeColorClass = "";
  if (isCrit) outcomeColorClass = "text-accent"; // Dourado
  else if (isFumble) outcomeColorClass = "text-destructive font-bold"; // Vermelho
  else if (isSuccess) outcomeColorClass = "text-primary"; // Verde
  else outcomeColorClass = "text-destructive"; // Vermelho

  let rollStr = `<span class="font-bold text-primary-foreground">${mainRoll}</span> (d20)`;
  if (advantageRoll) {
    rollStr += ` + <span class="font-bold text-primary-foreground">${advantageRoll}</span> (d4)`;
  }

  let modStr = "";
  if (modifier > 0) modStr = `+${modifier}`;
  if (modifier < 0) modStr = `${modifier}`;

  // Corrigido: `class` estava sem aspas
  const targetStr = `(Alvo: ${target}${
    modStr
      ? ` [<span class="text-foreground">${
          result.target - modifier
        }</span>${modStr}]`
      : ""
  })`;

  let outcome = "";
  if (isCrit)
    outcome = `✨ <span class="${outcomeColorClass} font-bold">Sucesso Crítico!</span>`;
  else if (isFumble)
    outcome = `💥 <span class="${outcomeColorClass} font-bold">Falha Crítica!</span>`;
  else if (isSuccess)
    outcome = `✔️ <span class="${outcomeColorClass} font-bold">Sucesso</span>`;
  else
    outcome = `❌ <span class="${outcomeColorClass} font-bold">Falha</span>`;

  return `${characterName} fez um teste de <span class="text-primary-foreground font-bold">${attributeName}</span>...
Rolagem: ${rollStr} = <span class="text-primary-foreground font-bold text-lg">${totalRoll}</span>
${targetStr}
Resultado: ${outcome}`;
};