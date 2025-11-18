// src/features/character/hooks/useCharacterCalculations.ts

import { useMemo } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { roundUpDiv, Armor, InventoryItem } from "../character.schema";

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
  const abilities = form.watch("abilities"); // <-- NOVO

  const totalAttributePointsSpent = useMemo(() => {
    return (
      (cunning || 0) +
      (discreet || 0) +
      (persuasive || 0) +
      (precise || 0) +
      (quick || 0) +
      (resolute || 0) +
      (vigilant || 0) +
      (vigorous || 0)
    );
  }, [cunning, discreet, persuasive, precise, quick, resolute, vigilant, vigorous]);
  
  const remainingAttributePoints = useMemo(() => {
    return 80 - totalAttributePointsSpent;
  }, [totalAttributePointsSpent]);

  const toughnessMax = useMemo(() => {
    const base = Math.max(10, vigorous || 0);
    return base + (toughnessBonus || 0);
  }, [vigorous, toughnessBonus]);

  const painThreshold = useMemo(() => {
    const base = roundUpDiv(vigorous || 0, 2);
    return base + (painThresholdBonus || 0);
  }, [vigorous, painThresholdBonus]);

  const corruptionThreshold = useMemo(() => {
    return roundUpDiv(resolute || 0, 2);
  }, [resolute]);

  const currentWeight = useMemo(() => {
    if (!Array.isArray(inventory)) return 0;
    return inventory.reduce(
      (acc: number, item: InventoryItem) =>
        acc + (item.weight || 0) * (item.quantity || 0),
      0,
    );
  }, [inventory]);

  const encumbranceThreshold = useMemo(() => vigorous || 0, [vigorous]);
  const maxEncumbrance = useMemo(() => (vigorous || 0) * 2, [vigorous]);

  const encumbrancePenalty = useMemo(() => {
    return Math.max(0, currentWeight - encumbranceThreshold);
  }, [currentWeight, encumbranceThreshold]);
  
  const totalObstrutiva = useMemo(() => {
    if (!Array.isArray(armors)) return 0;
    return armors
      .filter((a: Armor) => a.equipped)
      .reduce((acc: number, a: Armor) => acc + (a.obstructive || 0), 0);
  }, [armors]);

  // --- DETEÇÃO DE AMOQUE ---
  const activeBerserk = useMemo(() => {
    if (!Array.isArray(abilities)) return null;
    return abilities.find(a => a.name.toLowerCase().includes("amoque") && a.isActive);
  }, [abilities]);
  // -------------------------

  const totalDefense = useMemo(() => {
    let effectiveQuick = quick || 0;

    // Regra de Amoque: Se ativo e não Mestre, Rápido conta como 5
    if (activeBerserk && activeBerserk.level !== 'Mestre') {
       effectiveQuick = 5;
    }

    return effectiveQuick - totalObstrutiva - encumbrancePenalty;
  }, [quick, totalObstrutiva, encumbrancePenalty, activeBerserk]);

  const currentExperience = useMemo(() => {
    return (experience?.total || 0) - (experience?.spent || 0);
  }, [experience]);

  return {
    toughnessMax,
    painThreshold,
    corruptionThreshold,
    totalDefense,
    quick: quick || 0,
    vigorous: vigorous || 0,
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
    totalAttributePointsSpent,
    remainingAttributePoints,
    activeBerserk, // <-- EXPORTADO
  };
};