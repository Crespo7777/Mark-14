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

// --- FUNÇÕES DE TESTE DE ATRIBUTO ---

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

  const target = attributeValue + modifier;
  const totalRoll = mainRoll + (advantageRoll || 0);

  const isSuccess = totalRoll <= target;
  const isCrit = mainRoll === 1;
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

// --- (Função Auxiliar de Formatação de Teste) ---
const formatTestResult = (
  title: string,
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

  let outcomeColorClass = "";
  if (isCrit) outcomeColorClass = "text-accent";
  else if (isFumble) outcomeColorClass = "text-destructive font-bold";
  else if (isSuccess) outcomeColorClass = "text-primary";
  else outcomeColorClass = "text-destructive";

  let rollStr = `<span class="font-bold text-primary-foreground">${mainRoll}</span> (d20)`;
  if (advantageRoll) {
    rollStr += ` + <span class="font-bold text-primary-foreground">${advantageRoll}</span> (d4)`;
  }

  let modStr = "";
  if (modifier > 0) modStr = `+${modifier}`;
  if (modifier < 0) modStr = `${modifier}`;

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

  return `${title}
Rolagem: ${rollStr} = <span class="text-primary-foreground font-bold text-lg">${totalRoll}</span>
${targetStr}
Resultado: ${outcome}`;
};

/**
 * Formata um resultado de teste de atributo para o chat.
 */
export const formatAttributeTest = (
  characterName: string,
  attributeName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} fez um teste de <span class="text-primary-foreground font-bold">${attributeName}</span>...`;
  return formatTestResult(title, result);
};

/**
 * Formata um resultado de teste de Habilidade para o chat.
 */
export const formatAbilityTest = (
  characterName: string,
  abilityName: string,
  attributeName: string,
  result: AttributeRollResult,
  corruptionCost: number,
): string => {
  const title = `${characterName} usou <span class="text-primary-foreground font-bold">${abilityName}</span> (Teste de ${attributeName})...`;
  const baseMessage = formatTestResult(title, result);
  
  const corruptionStr =
    corruptionCost > 0
      ? `\n<span class="text-purple-400">(+${corruptionCost} Corrupção Temporária)</span>`
      : "";

  return `${baseMessage}${corruptionStr}`;
};

// --- NOVAS FUNÇÕES DE ROLAGEM DE COMBATE ---

/**
 * Formata um teste de ATAQUE de Arma para o chat.
 */
export const formatAttackRoll = (
  characterName: string,
  weaponName: string,
  attributeName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} ataca com <span class="text-primary-foreground font-bold">${weaponName}</span> (Teste de ${attributeName})...`;
  return formatTestResult(title, result);
};

/**
 * Formata um teste de DEFESA para o chat.
 */
export const formatDefenseRoll = (
  characterName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} faz um teste de <span class="text-primary-foreground font-bold">Defesa</span>...`;
  return formatTestResult(title, result);
};

/**
 * Formata uma rolagem de DANO de Arma para o chat.
 */
export const formatDamageRoll = (
  characterName: string,
  weaponName: string,
  baseRoll: DiceRoll,
  advantageRoll: DiceRoll | null,
  modifier: number,
  totalDamage: number,
): string => {
  let damageStr = `<span class="text-primary-foreground">[${baseRoll.rolls.join(
    ", ",
  )}]</span> (Dano)`;

  if (advantageRoll) {
    damageStr += ` + <span class="text-primary-foreground">[${advantageRoll.rolls.join(
      ", ",
    )}]</span> (Vantagem)`;
  }

  if (modifier > 0) {
    damageStr += ` + <span class="text-primary-foreground">${modifier}</span> (Mod)`;
  } else if (modifier < 0) {
    damageStr += ` - <span class="text-primary-foreground">${Math.abs(
      modifier,
    )}</span> (Mod)`;
  }

  return `${characterName} rola o dano de <span class="text-primary-foreground font-bold">${weaponName}</span>...
${damageStr}
Total: <span class="text-primary-foreground font-bold text-lg">${totalDamage}</span> Dano`;
};

/**
 * Formata uma rolagem de PROTEÇÃO de Armadura para o chat.
 */
export const formatProtectionRoll = (
  characterName: string,
  armorName: string,
  protectionRoll: DiceRoll,
): string => {
  const rollStr = `<span class="text-primary-foreground">[${protectionRoll.rolls.join(
    ", ",
  )}]</span>`;

  return `${characterName} rola <span class="text-primary-foreground font-bold">${armorName}</span> para Proteção...
Rolagem: ${rollStr} = <span class="text-primary-foreground font-bold text-lg">${protectionRoll.total}</span> Proteção`;
};