// src/features/character/hooks/useCharacterCalculations.ts
import { useCharacterSheet } from "../CharacterSheetContext";
import { useMemo, useEffect } from "react";

export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  // --- Observar campos para reatividade imediata ---
  const attributes = form.watch("attributes");
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  
  const armors = form.watch("armors") || [];
  const inventory = form.watch("inventory") || [];
  const projectiles = form.watch("projectiles") || [];
  const experience = form.watch("experience");
  const corruption = form.watch("corruption");
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);

  // --- Função Auxiliar de Tratamento de Peso ---
  const parseWeight = (value: string | number | undefined): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    
    // Troca vírgula por ponto e remove espaços
    const cleanString = value.toString().replace(",", ".").trim();
    const result = parseFloat(cleanString);
    
    return isNaN(result) ? 0 : result;
  };

  const calculations = useMemo(() => {
    // 1. Atributos
    const strong = Number(attributes?.vigorous?.value || attributes?.vigorous || 0);
    const quick = Number(attributes?.quick?.value || attributes?.quick || 0);
    const resolute = Number(attributes?.resolute?.value || attributes?.resolute || 0);

    // 2. Limiar de Dor
    const basePainThreshold = Math.ceil(strong / 2);
    const painThreshold = Math.max(1, basePainThreshold + painThresholdBonus);

    // 3. Defesa
    const equippedArmors = armors.filter((a: any) => a.equipped);
    const armorImpeding = equippedArmors.reduce((acc: number, item: any) => {
        // CORREÇÃO AQUI: Math.abs() garante que pegamos a magnitude (2) e não o valor negativo (-2)
        // Assim, a conta 'Quick - Impeding' subtrai corretamente.
        return acc + Math.abs(Number(item.obstructive) || 0);
    }, 0);
    const defense = quick - armorImpeding;

    // 4. Vida Máxima
    const maxHpBase = Math.max(10, strong);
    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // 5. Carga e Peso
    const inventoryWeight = inventory.reduce((acc: number, item: any) => {
      const itemWeight = parseWeight(item.weight);
      return acc + itemWeight;
    }, 0);

    const projectilesWeight = projectiles.reduce((acc: number, item: any) => {
      const itemWeight = parseWeight(item.weight);
      return acc + itemWeight;
    }, 0);

    const totalWeight = inventoryWeight + projectilesWeight;
    
    // Regra: Carga Máxima = Atributo Forte
    const maxLoad = strong > 0 ? strong : 10;
    
    let encumbranceStatus = "Leve";
    if (totalWeight > maxLoad) encumbranceStatus = "Sobrecarregado";
    else if (totalWeight > maxLoad / 2) encumbranceStatus = "Pesado";

    // 6. XP
    const currentXp = (Number(experience?.total) || 0) - (Number(experience?.spent) || 0);
    
    // 7. Corrupção
    const corruptionThreshold = Math.ceil(resolute / 2);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    // 8. Amoque (Berserk)
    const abilities = form.getValues("abilities") || [];
    const activeBerserk = abilities.find((a: any) => a.name?.toLowerCase().includes("amoque") && a.isActive);

    return {
      strong,
      quick,
      painThreshold,
      defense,
      totalDefense: defense,
      armorImpeding,
      totalWeight,
      maxLoad,
      encumbranceStatus,
      currentExperience: currentXp,
      corruptionThreshold,
      totalCorruption,
      toughnessMax,
      activeBerserk
    };
  }, [
    attributes, 
    toughnessMaxMod, 
    armors, 
    inventory, 
    projectiles,
    experience,
    corruption, 
    painThresholdBonus
  ]);

  // --- Guardião da Vida ---
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