// src/features/character/hooks/useCharacterCalculations.ts

import { useMemo } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { roundUpDiv, Armor, InventoryItem } from "../character.schema";

// Helper para garantir número nos cálculos
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
  const inventory = form.watch("inventory");
  const experience = form.watch("experience");
  const painThresholdBonus = form.watch("painThresholdBonus");
  const abilities = form.watch("abilities");

  const totalAttributePointsSpent = useMemo(() => {
    return (
      num(cunning) +
      num(discreet) +
      num(persuasive) +
      num(precise) +
      num(quick) +
      num(resolute) +
      num(vigilant) +
      num(vigorous)
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

  const currentWeight = useMemo(() => {
    if (!Array.isArray(inventory)) return 0;
    return inventory.reduce(
      (acc: number, item: InventoryItem) =>
        acc + num(item.weight) * num(item.quantity),
      0,
    );
  }, [inventory]);

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