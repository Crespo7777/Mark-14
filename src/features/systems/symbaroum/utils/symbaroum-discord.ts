import { AttributeRollResult } from "./symbaroum-dice";
import { DiceRoll } from "@/lib/dice-parser";

// Cores Oficiais do seu index.ts
export const DISCORD_COLORS = {
  CRITICAL: 3066993,  // Verde
  SUCCESS: 65280,     // Verde Neon
  FUMBLE: 15158332,   // Vermelho Escuro
  FAILURE: 10038562,  // Vermelho
  INFO: 14981709,     // Âmbar
  DEFENSE: 3447003,   // Azul
  DAMAGE: 14981709    // Âmbar (Reutilizado do Info para Dano)
};

const safeStr = (val: any, fb: string) => (val ? String(val) : fb);

// --- FORMATADORES DE TEXTO ---

const formatResultString = (result: AttributeRollResult): string => {
  if (result.isCrit) return "✨ **Sucesso Crítico!**";
  if (result.isSuccess) return "✔️ **Sucesso**";
  if (result.isFumble) return "💥 **Falha Crítica!**";
  return "❌ **Falha**";
};

const formatRollString = (result: AttributeRollResult): string => {
  let rollStr = `${result.mainRoll} (d20)`;
  if (result.advantageRoll) {
    rollStr += ` + ${result.advantageRoll} (d4)`;
  }
  return `\`${rollStr} = ${result.totalRoll}\``;
};

const formatTargetString = (result: AttributeRollResult): string => {
  const target = result.target || 0;
  let modStr = "";
  if (result.modifier > 0) modStr = ` [${target - result.modifier} +${result.modifier}]`;
  if (result.modifier < 0) modStr = ` [${target - result.modifier} ${result.modifier}]`;
  return `\`${target}\`${modStr}`;
};

const getResultColor = (result: AttributeRollResult): number => {
  if (result.isCrit) return DISCORD_COLORS.CRITICAL;
  if (result.isSuccess) return DISCORD_COLORS.SUCCESS;
  if (result.isFumble) return DISCORD_COLORS.FUMBLE;
  return DISCORD_COLORS.FAILURE;
};

// --- BUILDERS DE PAYLOAD ---

export const buildAttributePayload = (charName: string, attrName: string, result: AttributeRollResult) => {
  return {
    embeds: [{
      author: { name: safeStr(charName, "Alguém") },
      title: `Teste de ${safeStr(attrName, "Atributo")}`,
      color: getResultColor(result),
      fields: [
        { name: "Rolagem 🎯 Alvo", value: `${formatRollString(result)} | ${formatTargetString(result)}`, inline: false },
        { name: "Resultado", value: formatResultString(result), inline: false },
      ],
      footer: { text: "Mark-14 VTT" }
    }]
  };
};

export const buildAttackPayload = (charName: string, weaponName: string, attrName: string, result: AttributeRollResult) => {
  return {
    embeds: [{
      author: { name: safeStr(charName, "Alguém") },
      title: `Ataque com ${safeStr(weaponName, "Arma")}`,
      color: getResultColor(result),
      fields: [
        { name: "Rolagem 🎯 Alvo", value: `${formatRollString(result)} | ${formatTargetString(result)}`, inline: false },
        { name: "Resultado", value: formatResultString(result), inline: false },
      ],
      footer: { text: `Atributo: ${safeStr(attrName, "???")}` }
    }]
  };
};

export const buildDamagePayload = (charName: string, weaponName: string, totalDamage: number, baseRoll: DiceRoll, advantageRoll: DiceRoll | null, modifier: number) => {
    const baseRolls = baseRoll.rolls.join(", ");
    let rollStr = `[${baseRolls}] (Base)`;
    
    if (advantageRoll) {
        rollStr += ` + [${advantageRoll.rolls.join(", ")}] (Vantagem)`;
    }
    if (modifier > 0) rollStr += ` + ${modifier} (Mod)`;
    else if (modifier < 0) rollStr += ` - ${Math.abs(modifier)} (Mod)`;

    return {
        embeds: [{
            author: { name: safeStr(charName, "Alguém") },
            title: `Dano com ${safeStr(weaponName, "Arma")}`,
            description: `${rollStr}\nTotal = **${totalDamage}** Dano`,
            color: DISCORD_COLORS.INFO,
            footer: { text: "Mark-14 VTT" }
        }]
    };
};

export const buildProtectionPayload = (charName: string, armorName: string, result: DiceRoll, formula: string) => {
    const rollsStr = `[${result.rolls.join(", ")}]`;
    
    return {
        embeds: [{
            author: { name: safeStr(charName, "Alguém") },
            title: `Proteção: ${safeStr(armorName, "Armadura")}`,
            description: `${rollsStr} (Fórmula: ${formula})\nAbsorveu = **${result.total}** Dano`,
            color: DISCORD_COLORS.DEFENSE,
            footer: { text: "Mark-14 VTT" }
        }]
    };
};

export const buildAbilityPayload = (charName: string, abilityName: string, attrName: string, result: AttributeRollResult, corruptionCost: number) => {
    const footerText = corruptionCost > 0 
        ? `+${corruptionCost} Corrupção | Atributo: ${safeStr(attrName, "?")}`
        : `Atributo: ${safeStr(attrName, "?")}`;

    return {
        embeds: [{
            author: { name: safeStr(charName, "Alguém") },
            title: `Usou ${safeStr(abilityName, "Habilidade")}`,
            color: getResultColor(result),
            fields: [
                { name: "Rolagem 🎯 Alvo", value: `${formatRollString(result)} | ${formatTargetString(result)}`, inline: false },
                { name: "Resultado", value: formatResultString(result), inline: false },
            ],
            footer: { text: footerText }
        }]
    };
};

export const buildManualPayload = (charName: string, command: string, result: DiceRoll) => {
    return {
        embeds: [{
            author: { name: safeStr(charName, "Alguém") },
            title: `Rolou ${safeStr(command, "Dados")}`,
            description: `[${result.rolls.join(", ")}] = **${result.total}**`,
            color: DISCORD_COLORS.INFO,
            footer: { text: "Mark-14 VTT" }
        }]
    };
};