// src/features/character/hooks/useCharacterCalculations.ts

import { useMemo } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { roundUpDiv, Armor, InventoryItem, Weapon } from "../character.schema";

const num = (val: any) => Number(val) || 0;

export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  const {
    cunning,
    discreet,
    persuasive,
    precise,
    quick,
    resolute,
    vigilant,
    vigorous,
  } = form.watch("attributes");
  
  const toughnessBonus = form.watch("toughness.bonus");
  const armors = form.watch("armors");
  const weapons = form.watch("weapons");
  const inventory = form.watch("inventory");
  const experience = form.watch("experience");
  const painThresholdBonus = form.watch("painThresholdBonus");
  const abilities = form.watch("abilities");

  const totalAttributePointsSpent = useMemo(() => {
    return (
      num(cunning) + num(discreet) + num(persuasive) + num(precise) +
      num(quick) + num(resolute) + num(vigilant) + num(vigorous)
    );
  }, [cunning, discreet, persuasive, precise, quick, resolute, vigilant, vigorous]);
  
  const remainingAttributePoints = useMemo(() => {
    return 80 - totalAttributePointsSpent;
  }, [totalAttributePointsSpent]);

  const toughnessMax = useMemo(() => {
    const base = Math.max(10, num(vigorous));
    return base + num(toughnessBonus);
  }, [vigorous, toughnessBonus]);

  const painThreshold = useMemo(() => {
    const base = roundUpDiv(num(vigorous), 2);
    return base + num(painThresholdBonus);
  }, [vigorous, painThresholdBonus]);

  const corruptionThreshold = useMemo(() => {
    return roundUpDiv(num(resolute), 2);
  }, [resolute]);

  // --- CORREÇÃO: SOMA COMPLETA DE PESO ---
  const currentWeight = useMemo(() => {
    let total = 0;
    // 1. Mochila
    if (Array.isArray(inventory)) {
      total += inventory.reduce((acc, item) => acc + num(item.weight) * num(item.quantity), 0);
    }
    // 2. Armas
    if (Array.isArray(weapons)) {
      total += weapons.reduce((acc, w) => acc + num(w.weight), 0);
    }
    // 3. Armaduras
    if (Array.isArray(armors)) {
      total += armors.reduce((acc, a) => acc + num(a.weight), 0);
    }
    return total;
  }, [inventory, weapons, armors]);

  const encumbranceThreshold = useMemo(() => num(vigorous), [vigorous]);
  const maxEncumbrance = useMemo(() => num(vigorous) * 2, [vigorous]);

  const encumbrancePenalty = useMemo(() => {
    return Math.max(0, currentWeight - encumbranceThreshold);
  }, [currentWeight, encumbranceThreshold]);
  
  const totalObstrutiva = useMemo(() => {
    if (!Array.isArray(armors)) return 0;
    return armors
      .filter((a: Armor) => a.equipped)
      .reduce((acc: number, a: Armor) => acc + num(a.obstructive), 0);
  }, [armors]);

  const activeBerserk = useMemo(() => {
    if (!Array.isArray(abilities)) return null;
    return abilities.find(a => a.name.toLowerCase().includes("amoque") && a.isActive);
  }, [abilities]);

  const totalDefense = useMemo(() => {
    let effectiveQuick = num(quick);
    if (activeBerserk && activeBerserk.level !== 'Mestre') {
       effectiveQuick = 5;
    }
    return effectiveQuick - totalObstrutiva - encumbrancePenalty;
  }, [quick, totalObstrutiva, encumbrancePenalty, activeBerserk]);

  const currentExperience = useMemo(() => {
    return num(experience?.total) - num(experience?.spent);
  }, [experience]);

  return {
    toughnessMax,
    painThreshold,
    corruptionThreshold,
    totalDefense,
    quick: num(quick),
    vigorous: num(vigorous),
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
    totalAttributePointsSpent,
    remainingAttributePoints,
    activeBerserk,
  };
};