import { rollDie, DiceRoll } from "@/lib/dice-parser";

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
 * Lógica Symbaroum (Roll Under).
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
  const totalRoll = mainRoll - (advantageRoll || 0);

  const isSuccess = totalRoll <= target && mainRoll !== 20;
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

const formatTestResult = (title: string, result: AttributeRollResult): string => {
  const { mainRoll, advantageRoll, modifier, totalRoll, target, isSuccess, isCrit, isFumble } = result;

  let outcomeColorClass = "";
  if (isCrit) outcomeColorClass = "text-accent";
  else if (isFumble) outcomeColorClass = "text-destructive font-bold";
  else if (isSuccess) outcomeColorClass = "text-primary";
  else outcomeColorClass = "text-destructive";

  let rollStr = `<span class="font-bold text-primary-foreground">${mainRoll}</span> (d20)`;
  if (advantageRoll) {
    rollStr += ` - <span class="font-bold text-green-400">${advantageRoll}</span> (Vantagem)`;
  }

  let modStr = "";
  if (modifier > 0) modStr = `+${modifier}`;
  if (modifier < 0) modStr = `${modifier}`;

  const targetStr = `(Alvo: ${target}${modStr ? ` [<span class="text-foreground">${result.target - modifier}</span>${modStr}]` : ""})`;

  let outcome = "";
  if (isCrit) outcome = `✨ <span class="${outcomeColorClass} font-bold">Sucesso Crítico!</span>`;
  else if (isFumble) outcome = `💥 <span class="${outcomeColorClass} font-bold">Falha Crítica!</span>`;
  else if (isSuccess) outcome = `✔️ <span class="${outcomeColorClass} font-bold">Sucesso</span>`;
  else outcome = `❌ <span class="${outcomeColorClass} font-bold">Falha</span>`;

  return `${title}\nRolagem: ${rollStr} = <span class="text-primary-foreground font-bold text-lg">${totalRoll}</span>\n${targetStr}\nResultado: ${outcome}`;
};

// --- CORREÇÃO AQUI: Renomeado de formatAttributeTest para formatAttributeRoll ---
export const formatAttributeRoll = (characterName: string, attributeName: string, result: AttributeRollResult): string => {
  const title = `${characterName} fez um teste de <span class="text-primary-foreground font-bold">${attributeName}</span>...`;
  return formatTestResult(title, result);
};

// Mantivemos o alias antigo caso algum outro arquivo use 'Test' em vez de 'Roll'
export const formatAttributeTest = formatAttributeRoll;

export const formatAbilityTest = (characterName: string, abilityName: string, attributeName: string, result: AttributeRollResult, corruptionCost: number): string => {
  const title = `${characterName} usou <span class="text-primary-foreground font-bold">${abilityName}</span> (Teste de ${attributeName})...`;
  const baseMessage = formatTestResult(title, result);
  const corruptionStr = corruptionCost > 0 ? `\n<span class="text-purple-400">(+${corruptionCost} Corrupção Temporária)</span>` : "";
  return `${baseMessage}${corruptionStr}`;
};

export const formatAttackRoll = (characterName: string, weaponName: string, attributeName: string, result: AttributeRollResult): string => {
  const title = `${characterName} ataca com <span class="text-primary-foreground font-bold">${weaponName}</span> (Teste de ${attributeName})...`;
  return formatTestResult(title, result);
};

export const formatDefenseRoll = (characterName: string, result: AttributeRollResult): string => {
  const title = `${characterName} faz um teste de <span class="text-primary-foreground font-bold">Defesa</span>...`;
  return formatTestResult(title, result);
};

export const formatDamageRoll = (characterName: string, weaponName: string, baseRoll: DiceRoll, advantageRoll: DiceRoll | null, modifier: number, totalDamage: number): string => {
  let damageStr = `<span class="text-primary-foreground">[${baseRoll.rolls.join(", ")}]</span> (Dano)`;
  if (advantageRoll) damageStr += ` + <span class="text-primary-foreground">[${advantageRoll.rolls.join(", ")}]</span> (Vantagem)`;
  if (modifier > 0) damageStr += ` + <span class="text-primary-foreground">${modifier}</span> (Mod)`;
  else if (modifier < 0) damageStr += ` - <span class="text-primary-foreground">${Math.abs(modifier)}</span> (Mod)`;

  return `${characterName} rola o dano de <span class="text-primary-foreground font-bold">${weaponName}</span>...\n${damageStr}\nTotal: <span class="text-primary-foreground font-bold text-lg">${totalDamage}</span> Dano`;
};

export const formatProtectionRoll = (characterName: string, armorName: string, protectionRoll: DiceRoll): string => {
  const rollStr = `<span class="text-primary-foreground">[${protectionRoll.rolls.join(", ")}]</span>`;
  return `${characterName} rola <span class="text-primary-foreground font-bold">${armorName}</span> para Proteção...\nRolagem: ${rollStr} = <span class="text-primary-foreground font-bold text-lg">${protectionRoll.total}</span> Proteção`;
};