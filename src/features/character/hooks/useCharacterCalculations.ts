// src/features/character/hooks/useCharacterCalculations.ts

import { useCharacterSheet } from "../CharacterSheetContext";
import { useMemo, useEffect } from "react";
import { ATTRIBUTES, SYSTEM_RULES } from "../character.constants";

export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  const attributes = form.watch("attributes");
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  
  const weapons = form.watch("weapons") || []; 
  const armors = form.watch("armors") || [];
  const inventory = form.watch("inventory") || [];
  const projectiles = form.watch("projectiles") || [];
  const abilities = form.watch("abilities") || []; 
  
  const experience = form.watch("experience");
  const corruption = form.watch("corruption");
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);

  const parseWeight = (value: string | number | undefined): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const cleanString = value.toString().replace(",", ".").trim();
    const result = parseFloat(cleanString);
    return isNaN(result) ? 0 : result;
  };

  // Função auxiliar para verificar se uma habilidade específica está ativa
  // Aceita um array de nomes possíveis (ex: ["Amoque", "Berserk"])
  const checkAbilityActive = (abilityList: any[], targetNames: string[]) => {
    return abilityList.find((a: any) => 
        targetNames.some(name => a.name?.toLowerCase().includes(name)) && a.isActive
    );
  };

  const calculations = useMemo(() => {
    // 1. Ler Atributos BASE da Ficha
    // Normalização: Tenta ler o valor ou o objeto. Tenta 'strong' e o alias 'vigorous'.
    let strong = Number(attributes?.[ATTRIBUTES.STRONG]?.value || attributes?.[ATTRIBUTES.STRONG] || attributes?.[ATTRIBUTES.VIGOROUS]?.value || attributes?.[ATTRIBUTES.VIGOROUS] || 0);
    let quick = Number(attributes?.[ATTRIBUTES.QUICK]?.value || attributes?.[ATTRIBUTES.QUICK] || 0);
    let resolute = Number(attributes?.[ATTRIBUTES.RESOLUTE]?.value || attributes?.[ATTRIBUTES.RESOLUTE] || 0);
    let vigilant = Number(attributes?.[ATTRIBUTES.VIGILANT]?.value || attributes?.[ATTRIBUTES.VIGILANT] || 0);
    let persuasive = Number(attributes?.[ATTRIBUTES.PERSUASIVE]?.value || attributes?.[ATTRIBUTES.PERSUASIVE] || 0);
    let cunning = Number(attributes?.[ATTRIBUTES.CUNNING]?.value || attributes?.[ATTRIBUTES.CUNNING] || 0);
    let discreet = Number(attributes?.[ATTRIBUTES.DISCREET]?.value || attributes?.[ATTRIBUTES.DISCREET] || 0);
    let precise = Number(attributes?.[ATTRIBUTES.PRECISE]?.value || attributes?.[ATTRIBUTES.PRECISE] || 0);

    // --- 2. APLICAÇÃO DE BÓNUS DE "ATRIBUTO EXCEPCIONAL" ---
    abilities.forEach((ability: any) => {
        if (ability.isActive && SYSTEM_RULES.ABILITIES.EXCEPTIONAL_ATTRIBUTE.some(key => ability.name?.toLowerCase().includes(key))) {
            
            let bonus = 1; // Novato
            if (ability.level === SYSTEM_RULES.LEVELS.ADEPT) bonus = 2;
            if (ability.level === SYSTEM_RULES.LEVELS.MASTER) bonus = 3;

            // Aplica ao atributo correto usando as constantes
            switch (ability.associatedAttribute) {
                case ATTRIBUTES.STRONG: 
                case ATTRIBUTES.VIGOROUS: strong += bonus; break;
                
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

    // --- 3. OUTRAS HABILIDADES ESPECIAIS ---
    const activeBerserk = checkAbilityActive(abilities, SYSTEM_RULES.ABILITIES.BERSERK);
    const featOfStrength = checkAbilityActive(abilities, SYSTEM_RULES.ABILITIES.FEAT_OF_STRENGTH);

    // --- 4. CÁLCULOS DERIVADOS ---

    // A. Defesa
    let defensiveQuick = quick;
    if (activeBerserk) {
        // Se NÃO for Mestre, defesa é reduzida (penalidade)
        if (activeBerserk.level !== SYSTEM_RULES.LEVELS.MASTER) {
            defensiveQuick = 5; // Valor fixo de penalidade do sistema
        }
    }

    const equippedArmors = armors.filter((a: any) => a.equipped);
    const totalObstructive = equippedArmors.reduce((acc: number, item: any) => {
        let valString = String(item.obstructive || "0").replace(",", ".");
        let val = parseFloat(valString);
        if (isNaN(val)) val = 0;
        return acc + Math.abs(val);
    }, 0);
    
    const defense = defensiveQuick - totalObstructive;

    // B. Limiar de Dor
    const basePainThreshold = Math.ceil(strong / SYSTEM_RULES.PAIN_THRESHOLD_DIVISOR);
    const painThreshold = Math.max(1, basePainThreshold + painThresholdBonus);

    // C. Vida Máxima
    let maxHpBase = Math.max(SYSTEM_RULES.MIN_HP_THRESHOLD, strong);
    
    // Regra Façanha de Força: Vida = Forte + 5 (Se Novato ou maior, a lógica base assume que existe)
    if (featOfStrength) {
        maxHpBase = strong + 5;
    }

    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // Estado "Ensanguentado"
    const currentHp = Number(form.getValues("toughness.current")) || 0;
    const isBloodied = currentHp <= (toughnessMax / 2);

    // D. Carga e Peso
    const inventoryWeight = inventory.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const projectilesWeight = projectiles.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const weaponsWeight = weapons.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const armorsWeight = 0; 

    const totalWeight = inventoryWeight + projectilesWeight + weaponsWeight + armorsWeight;
    const baseLoad = strong > 0 ? strong : SYSTEM_RULES.ENCUMBRANCE.MIN_LIMIT;
    const maxLoad = baseLoad; // Aqui poderiamos adicionar bónus de carga se existissem (ex: mochila robusta)
    
    let encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.LIGHT;
    if (totalWeight > maxLoad) encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.OVERLOADED;
    else if (totalWeight > maxLoad / 2) encumbranceStatus = SYSTEM_RULES.ENCUMBRANCE.STATUS.HEAVY;

    // E. XP e Corrupção
    const currentXp = (Number(experience?.total) || 0) - (Number(experience?.spent) || 0);
    const corruptionThreshold = Math.ceil(resolute / SYSTEM_RULES.CORRUPTION_THRESHOLD_DIVISOR);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      strong, 
      quick,
      resolute,
      vigilant,
      persuasive,
      cunning,
      discreet,
      precise,
      
      painThreshold,
      defense,
      totalDefense: defense,
      armorImpeding: totalObstructive,
      totalWeight,
      maxLoad,
      encumbranceStatus,
      currentExperience: currentXp,
      corruptionThreshold,
      totalCorruption,
      toughnessMax,
      activeBerserk,
      featOfStrength,
      isBloodied
    };
  }, [
    attributes, 
    toughnessMaxMod, 
    JSON.stringify(armors),
    JSON.stringify(weapons),
    JSON.stringify(inventory),
    JSON.stringify(projectiles),
    experience,
    corruption, 
    painThresholdBonus,
    JSON.stringify(abilities), 
    form.watch("toughness.current") 
  ]);

  useEffect(() => {
      const currentVal = Number(form.getValues("toughness.current")) || 0;
      if (currentVal > calculations.toughnessMax) {
          const timer = setTimeout(() => {
              form.setValue("toughness.current", calculations.toughnessMax, { shouldDirty: true });
          }, 0);
          return () => clearTimeout(timer);
      }
  }, [calculations.toughnessMax, form]); 

  return calculations;
};