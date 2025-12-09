// src/lib/dice-parser.ts

/**
 * Interface atualizada para o resultado da rolagem.
 * Agora suporta fórmulas mais complexas do que apenas XdY+Z.
 */
export interface DiceRoll {
  total: number;       // O valor final da soma
  formula: string;     // A fórmula original (ex: "1d20 + 1d4")
  rolls: number[];     // Todos os resultados de dados individuais (para efeitos visuais ou crit check)
  details: string;     // String detalhada (ex: "1d20[15] + 5")
  isCrit?: boolean;    // Flag opcional para identificar críticos (1 ou 20 no d20)
  isFumble?: boolean;  // Flag opcional para falhas críticas
}

/**
 * Rola um único dado
 * @param sides - Número de lados
 * @returns um número entre 1 e 'sides'
 */
export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Motor de Rolagem de Dados (Dice Engine)
 * Capaz de processar fórmulas como: "1d20 + 5", "1d8 + 1d6", "2d20kh1" (futuro)
 */
class DiceEngine {
  static roll(formula: string): DiceRoll | null {
    // Regex melhorado para capturar grupos: 1d20, +5, -1d4
    // G1/G4: Sinal (+ ou -)
    // G2: Quantidade de dados
    // G3: Lados do dado
    // G5: Valor fixo (modificador)
    const regex = /([+-]?)\s*(\d+)[dD](\d+)|([+-]?)\s*(\d+)/g;
    
    let match;
    let total = 0;
    let detailsParts: string[] = [];
    const allRolls: number[] = [];
    
    // Simples validação de sanidade
    if (!formula || formula.length > 50) return null;

    let hasMatch = false;

    // Iterar sobre todas as partes da fórmula (ex: "1d20", "+ 5")
    while ((match = regex.exec(formula)) !== null) {
      if (match[0].trim() === "") continue; // Ignorar espaços vazios
      hasMatch = true;

      const isDice = !!match[2]; // Se capturou grupo 2, é dado
      const signStr = match[1] || match[4] || '+'; // Sinal capturado ou + padrão
      const sign = signStr.includes('-') ? -1 : 1;
      const cleanSign = sign === -1 ? "- " : "+ "; // Para formatação bonita

      if (isDice) {
        const count = parseInt(match[2], 10);
        const faces = parseInt(match[3], 10);
        
        // Proteção contra abuso
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
        
        // Formatação: "1d20[15]"
        const firstTerm = detailsParts.length === 0;
        const prefix = firstTerm ? (sign === -1 ? "-" : "") : cleanSign;
        detailsParts.push(`${prefix}${count}d${faces}[${currentRolls.join(',')}]`);

      } else {
        // Modificador fixo
        const value = parseInt(match[5], 10);
        const termTotal = value * sign;
        total += termTotal;
        
        const firstTerm = detailsParts.length === 0;
        const prefix = firstTerm ? (sign === -1 ? "-" : "") : cleanSign;
        detailsParts.push(`${prefix}${value}`);
      }
    }

    if (!hasMatch) return null;

    // Deteção básica de Crítico/Falha para d20 (assumindo que se houver 1d20, é o teste principal)
    // Lógica simplificada: Se o primeiro dado for d20, verificamos ele.
    const isCrit = formula.includes("20") && allRolls.length > 0 && allRolls[0] === 1;
    const isFumble = formula.includes("20") && allRolls.length > 0 && allRolls[0] === 20;

    return {
      total,
      formula,
      rolls: allRolls,
      details: detailsParts.join(" "),
      isCrit,
      isFumble
    };
  }
}

/**
 * Analisa uma string de rolagem (ex: "2d6+3") e retorna o resultado.
 * Wrapper para a nova DiceEngine manter compatibilidade de nome.
 */
export const parseDiceRoll = (command: string): DiceRoll | null => {
  return DiceEngine.roll(command);
};

/**
 * Formata o resultado da rolagem para uma string amigável HTML.
 */
export const formatRollResult = (command: string, result: DiceRoll): string => {
  // A nova engine já nos dá os detalhes formatados (ex: "1d20[10] + 5")
  // Vamos apenas colorir os números dentro dos parênteses retos
  const formattedDetails = result.details.replace(
    /\[(.*?)\]/g, 
    `[<span class="text-primary-foreground">$1</span>]`
  );

  return `Rolou ${command}...\n${formattedDetails} = <span class="text-primary-foreground font-bold text-lg">${result.total}</span>`;
};

// --- FUNÇÕES DE TESTE DE ATRIBUTO ---

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
 * Mantida a lógica original de Symbaroum (Roll Under).
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
  
  // Em Symbaroum (Roll Under), a vantagem ajuda a baixar o resultado.
  const totalRoll = mainRoll - (advantageRoll || 0);

  const isSuccess = totalRoll <= target && mainRoll !== 20; // 20 é sempre falha
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
    rollStr += ` - <span class="font-bold text-green-400">${advantageRoll}</span> (Vantagem)`;
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

export const formatAttributeTest = (
  characterName: string,
  attributeName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} fez um teste de <span class="text-primary-foreground font-bold">${attributeName}</span>...`;
  return formatTestResult(title, result);
};

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

export const formatAttackRoll = (
  characterName: string,
  weaponName: string,
  attributeName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} ataca com <span class="text-primary-foreground font-bold">${weaponName}</span> (Teste de ${attributeName})...`;
  return formatTestResult(title, result);
};

export const formatDefenseRoll = (
  characterName: string,
  result: AttributeRollResult,
): string => {
  const title = `${characterName} faz um teste de <span class="text-primary-foreground font-bold">Defesa</span>...`;
  return formatTestResult(title, result);
};

/**
 * Formata uma rolagem de DANO.
 * Atualizado para usar a nova interface DiceRoll (que agora tem .details e .rolls)
 */
export const formatDamageRoll = (
  characterName: string,
  weaponName: string,
  baseRoll: DiceRoll,
  advantageRoll: DiceRoll | null,
  modifier: number,
  totalDamage: number,
): string => {
  // Como baseRoll agora é um objeto DiceRoll complexo, usamos o .details ou recriamos a string
  // Para manter o visual antigo, vamos aceder aos .rolls
  
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
 * Formata uma rolagem de PROTEÇÃO.
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

/**
 * Formata uma rolagem de atributo genérica baseada em DiceRoll simples.
 */
export const formatAttributeRoll = (
  characterName: string,
  attributeName: string,
  result: DiceRoll,
  target: number,
  contextName?: string
): string => {
  const total = result.total;
  
  // Verificação de críticos baseada nas flags da nova engine, ou fallback para lógica padrão
  const isCrit = result.isCrit || total === 1;
  const isFumble = result.isFumble || total === 20;
  const isSuccess = total <= target && !isFumble;

  let outcomeColor = isSuccess ? "text-primary" : "text-destructive";
  let outcomeText = isSuccess ? "Sucesso" : "Falha";
  
  if (isCrit) {
      outcomeColor = "text-accent";
      outcomeText = "Sucesso Crítico!";
  }
  if (isFumble) {
      outcomeColor = "text-destructive font-bold";
      outcomeText = "Falha Crítica!";
  }

  const action = contextName 
    ? `usa <span class="font-bold text-primary-foreground">${contextName}</span> (${attributeName})`
    : `testa <span class="font-bold text-primary-foreground">${attributeName}</span>`;

  return `${characterName} ${action}...
Rolagem: <span class="font-bold text-primary-foreground">${total}</span> (vs ${target})
Resultado: <span class="${outcomeColor} font-bold">${outcomeText}</span>`;
};