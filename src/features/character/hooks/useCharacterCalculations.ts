import { useCharacterSheet } from "../CharacterSheetContext";
import { useMemo } from "react";
import { attributesList } from "../character.constants";

export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  // Observar todos os campos que afetam cálculos
  const attributes = form.watch("attributes");
  const toughness = form.watch("toughness");
  const weapons = form.watch("weapons") || [];
  const armors = form.watch("armors") || [];
  const inventory = form.watch("inventory") || [];
  const projectiles = form.watch("projectiles") || [];
  const experience = form.watch("experience");
  const money = form.watch("money");
  const corruption = form.watch("corruption");
  
  // Modificadores manuais
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);

  return useMemo(() => {
    // 1. Atributos Básicos
    const strong = Number(attributes?.strong || 0);
    const quick = Number(attributes?.quick || 0);
    const resolute = Number(attributes?.resolute || 0);
    const vigorous = Number(attributes?.vigorous?.value || attributes?.vigorous || 0);

    // 2. Limiar de Dor (Metade da Força ou 5, + Bônus)
    const painThreshold = Math.ceil(strong / 2) + painThresholdBonus;

    // 3. Defesa (Rápido - Penalidade de Armadura)
    const equippedArmors = armors.filter((a: any) => a.equipped);
    const armorImpeding = equippedArmors.reduce((acc: number, item: any) => {
        return acc + (Number(item.obstructive) || 0);
    }, 0);
    
    const defense = quick - armorImpeding; 

    // 4. Carga e Peso (Encumbrance)
    // REGRA 1: Não multiplicar por quantidade (o peso inserido é o total da pilha)
    const inventoryWeight = inventory.reduce((acc: number, item: any) => {
      return acc + (Number(item.weight) || 0);
    }, 0);

    // REGRA 1: Não multiplicar por quantidade para projéteis também
    const projectilesWeight = projectiles.reduce((acc: number, item: any) => {
        return acc + (Number(item.weight) || 0);
    }, 0);

    // REGRA 2: Armas e Armaduras NÃO contam peso (apenas o que está na mochila conta)
    const totalWeight = inventoryWeight + projectilesWeight;
    
    // Limite de Carga (Baseado em Força/Strong)
    const maxLoad = strong > 0 ? strong : 10; 
    
    // Status de Carga
    let encumbranceStatus = "Leve";
    if (totalWeight > maxLoad) encumbranceStatus = "Sobrecarregado";
    else if (totalWeight > maxLoad / 2) encumbranceStatus = "Pesado";

    // 5. XP
    const totalXp = Number(experience?.total || 0);
    const spentXp = Number(experience?.spent || 0);
    const currentXp = totalXp - spentXp;

    // 6. Corrupção
    const corruptionThreshold = Math.ceil(resolute / 2);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    // 7. Vida Máxima
    const toughnessMax = Math.max(10, vigorous); 

    // 8. Amoque Ativo?
    const abilities = form.getValues("abilities") || [];
    const activeBerserk = abilities.find(
        (a: any) => a.name.toLowerCase().includes("amoque") && a.isActive
    );

    return {
      painThreshold,
      defense,
      totalDefense: defense,
      armorImpeding,
      totalWeight,
      projectilesWeight,
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
    toughness, 
    weapons, 
    armors, 
    inventory, 
    projectiles,
    experience, 
    money, 
    corruption, 
    painThresholdBonus
  ]);
};