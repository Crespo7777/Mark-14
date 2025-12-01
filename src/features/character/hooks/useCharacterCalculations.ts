import { useCharacterSheet } from "../CharacterSheetContext";
import { useMemo, useEffect } from "react"; // Import useEffect

export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  // Observar campos que afetam o cálculo (Otimizado para performance)
  const attributes = form.watch("attributes");
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  
  const armors = form.watch("armors") || [];
  const inventory = form.watch("inventory") || [];
  const projectiles = form.watch("projectiles") || [];
  const experience = form.watch("experience");
  const corruption = form.watch("corruption");
  
  // Modificadores manuais
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);

  // 1. Realizar os cálculos (useMemo)
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
        return acc + (Number(item.obstructive) || 0);
    }, 0);
    const defense = quick - armorImpeding;

    // 4. Vida Máxima
    const maxHpBase = Math.max(10, strong);
    // Se o campo for 0/vazio, assume 0. Sem fallbacks para campos antigos.
    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // 5. Carga
    const inventoryWeight = inventory.reduce((acc: number, item: any) => acc + (Number(item.weight) || 0), 0);
    const projectilesWeight = projectiles.reduce((acc: number, item: any) => acc + (Number(item.weight) || 0), 0);
    const totalWeight = inventoryWeight + projectilesWeight;
    const maxLoad = strong > 0 ? strong : 10;
    
    let encumbranceStatus = "Leve";
    if (totalWeight > maxLoad) encumbranceStatus = "Sobrecarregado";
    else if (totalWeight > maxLoad / 2) encumbranceStatus = "Pesado";

    // 6. XP e Corrupção
    const currentXp = (Number(experience?.total) || 0) - (Number(experience?.spent) || 0);
    const corruptionThreshold = Math.ceil(resolute / 2);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    // 7. Amoque
    const abilities = form.getValues("abilities") || [];
    const activeBerserk = abilities.find((a: any) => a.name.toLowerCase().includes("amoque") && a.isActive);

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

  // 2. GUARDIÃO DA VIDA (UseEffect)
  // Correção Automática: Se o Máximo mudar e ficar menor que o Atual, corta o excesso.
  useEffect(() => {
      const currentVal = Number(form.getValues("toughness.current")) || 0;
      
      if (currentVal > calculations.toughnessMax) {
          // Usa setTimeout para evitar erro de atualização durante a renderização
          const timer = setTimeout(() => {
              form.setValue("toughness.current", calculations.toughnessMax, { shouldDirty: true });
          }, 0);
          return () => clearTimeout(timer);
      }
  }, [calculations.toughnessMax, form]); 

  return calculations;
};