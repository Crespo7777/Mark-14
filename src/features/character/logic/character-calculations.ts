import { CharacterSheetData } from "../character.schema";
import { ATTRIBUTES, SYSTEM_RULES } from "../character.constants";

// Tipagem do retorno para uso no Store
export interface CharacterDerivedStats {
  strong: number; quick: number; resolute: number; vigilant: number;
  persuasive: number; cunning: number; discreet: number; precise: number;
  painThreshold: number; defense: number; totalDefense: number; armorImpeding: number;
  totalWeight: number; maxLoad: number; encumbranceStatus: string;
  currentExperience: number; corruptionThreshold: number; totalCorruption: number;
  toughnessMax: number; activeBerserk: any; featOfStrength: any; isBloodied: boolean;
}

export const calculateCharacterStats = (data: CharacterSheetData): CharacterDerivedStats => {
  const { attributes, toughness, experience, corruption, weapons, armors, inventory, projectiles, abilities, painThresholdBonus } = data;

  // 1. Atributos Base
  let strong = Number(attributes?.[ATTRIBUTES.STRONG]?.value || attributes?.[ATTRIBUTES.STRONG] || 0);
  let quick = Number(attributes?.[ATTRIBUTES.QUICK]?.value || attributes?.[ATTRIBUTES.QUICK] || 0);
  let resolute = Number(attributes?.[ATTRIBUTES.RESOLUTE]?.value || attributes?.[ATTRIBUTES.RESOLUTE] || 0);
  let vigilant = Number(attributes?.[ATTRIBUTES.VIGILANT]?.value || attributes?.[ATTRIBUTES.VIGILANT] || 0);
  let persuasive = Number(attributes?.[ATTRIBUTES.PERSUASIVE]?.value || attributes?.[ATTRIBUTES.PERSUASIVE] || 0);
  let cunning = Number(attributes?.[ATTRIBUTES.CUNNING]?.value || attributes?.[ATTRIBUTES.CUNNING] || 0);
  let discreet = Number(attributes?.[ATTRIBUTES.DISCREET]?.value || attributes?.[ATTRIBUTES.DISCREET] || 0);
  let precise = Number(attributes?.[ATTRIBUTES.PRECISE]?.value || attributes?.[ATTRIBUTES.PRECISE] || 0);

  // 2. Bónus de Habilidades
  (abilities || []).forEach((ability: any) => {
    if (ability.isActive && SYSTEM_RULES.ABILITIES.EXCEPTIONAL_ATTRIBUTE.some((key: string) => ability.name?.toLowerCase().includes(key))) {
      let bonus = 1;
      if (ability.level === SYSTEM_RULES.LEVELS.ADEPT) bonus = 2;
      if (ability.level === SYSTEM_RULES.LEVELS.MASTER) bonus = 3;

      switch (ability.associatedAttribute) {
        case ATTRIBUTES.STRONG: strong += bonus; break;
        case ATTRIBUTES.QUICK: quick += bonus; break;
        case ATTRIBUTES.RESOLUTE: resolute += bonus; break;
        case ATTRIBUTES.VIGILANT: vigilant += bonus; break;
        case ATTRIBUTES.PERSUASIVE: persuasive += bonus; break;
        case ATTRIBUTES.CUNNING: cunning += bonus; break;
        case ATTRIBUTES.DISCREET: discreet += bonus; break;
        case ATTRIBUTES.PRECISE: precise += bonus; break;
      }
    }
  });

  // 3. Verificações Especiais
  const checkActive = (nameList: string[]) => (abilities || []).find((a: any) => nameList.some(n => a.name?.toLowerCase().includes(n)) && a.isActive);
  const activeBerserk = checkActive(SYSTEM_RULES.ABILITIES.BERSERK);
  const featOfStrength = checkActive(SYSTEM_RULES.ABILITIES.FEAT_OF_STRENGTH);

  // 4. Defesa
  let defensiveQuick = quick;
  if (activeBerserk && activeBerserk.level !== SYSTEM_RULES.LEVELS.MASTER) {
    defensiveQuick = 5;
  }
  
  const totalObstructive = (armors || [])
    .filter((a: any) => a.equipped)
    .reduce((acc: number, item: any) => acc + Math.abs(Number(item.obstructive || 0)), 0);

  const defense = defensiveQuick - totalObstructive;

  // 5. Vida e Dor
  let maxHpBase = Math.max(SYSTEM_RULES.MIN_HP_THRESHOLD, strong);
  if (featOfStrength) maxHpBase = strong + 5;
  
  const toughnessMax = maxHpBase + (Number(toughness?.max_modifier) || 0);
  const currentHp = Number(toughness?.current) || 0;
  const painThreshold = Math.max(1, Math.ceil(strong / SYSTEM_RULES.PAIN_THRESHOLD_DIVISOR) + (Number(painThresholdBonus) || 0));

  // 6. Carga (Peso)
  const parseWeight = (v: any) => isNaN(parseFloat(v)) ? 0 : parseFloat(String(v).replace(',', '.'));
  const totalWeight = 
    (inventory || []).reduce((a: number, i: any) => a + parseWeight(i.weight), 0) +
    (projectiles || []).reduce((a: number, i: any) => a + parseWeight(i.weight), 0) +
    (weapons || []).reduce((a: number, i: any) => a + parseWeight(i.weight), 0);
  
  const maxLoad = Math.max(SYSTEM_RULES.ENCUMBRANCE.MIN_LIMIT, strong);
  let encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.LIGHT;
  if (totalWeight > maxLoad) encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.OVERLOADED;
  else if (totalWeight > maxLoad / 2) encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.HEAVY;

  return {
    strong, quick, resolute, vigilant, persuasive, cunning, discreet, precise,
    painThreshold, defense, totalDefense: defense, armorImpeding: totalObstructive,
    totalWeight, maxLoad, encumbranceStatus,
    currentExperience: (Number(experience?.total)||0) - (Number(experience?.spent)||0),
    corruptionThreshold: Math.ceil(resolute / SYSTEM_RULES.CORRUPTION_THRESHOLD_DIVISOR),
    totalCorruption: (Number(corruption?.temporary)||0) + (Number(corruption?.permanent)||0),
    toughnessMax, activeBerserk, featOfStrength,
    isBloodied: currentHp <= (toughnessMax / 2)
  };
};