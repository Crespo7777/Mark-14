// useNpcCalculations.ts
import { useNpcSheet } from "../NpcSheetContext";
import { useMemo, useEffect } from "react";

export const useNpcCalculations = () => {
  const { form } = useNpcSheet();

  // Observar mudanças nos campos
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  
  // --- INPUTS MANUAIS ---
  const manualDefense = form.watch("stats.defense");
  const manualPainThreshold = form.watch("stats.pain_threshold");
  const manualCorruptionThreshold = form.watch("stats.corruption_threshold");
  
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  const corruption = form.watch("corruption");

  // 1. CÁLCULOS (MEMOIZED)
  const calculations = useMemo(() => {
    const strong = Number(attributes?.vigorous?.value || 0);

    // Redução de Dano
    const damageReduction = armors.reduce((acc: number, item: any) => {
        const protectionValue = parseInt(item.protection);
        // CORREÇÃO: Math.abs garante que proteção seja sempre positiva
        const safeValue = isNaN(protectionValue) ? 0 : Math.abs(protectionValue);
        return acc + safeValue;
    }, 0);

    // Vida Máxima
    const maxHpBase = Math.max(10, strong);
    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // Corrupção Total
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      // Valores manuais com fallback
      painThreshold: Number(manualPainThreshold) || 0,
      corruptionThreshold: Number(manualCorruptionThreshold) || 0,
      totalDefense: Number(manualDefense) || 0, // NPCs usam defesa manual, não afetada por penalidades
      
      toughnessMax,
      totalCorruption,
      damageReduction
    };
  }, [attributes, toughnessMaxMod, armors, corruption, manualDefense, manualPainThreshold, manualCorruptionThreshold]);


  // 2. GUARDIÃO DE ESTADO
  useEffect(() => {
    const currentToughness = form.getValues("toughness.current");
    const max = calculations.toughnessMax;

    if (currentToughness === undefined || currentToughness === null) {
        form.setValue("toughness.current", max);
        return; 
    }

    if (currentToughness > max) {
        form.setValue("toughness.current", max, { shouldDirty: true, shouldTouch: true });
    }
  }, [calculations.toughnessMax, form]);

  return calculations;
};