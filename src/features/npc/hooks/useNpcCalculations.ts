import { useNpcSheet } from "../NpcSheetContext";
import { useMemo, useEffect } from "react";

export const useNpcCalculations = () => {
  const { form } = useNpcSheet();

  // Observar mudanças nos campos
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  
  // --- INPUTS MANUAIS ---
  // Agora o Limiar de Dor e Corrupção vêm de inputs diretos, sem calculo automatico
  const manualDefense = form.watch("stats.defense");
  const manualPainThreshold = form.watch("stats.pain_threshold");
  const manualCorruptionThreshold = form.watch("stats.corruption_threshold");
  
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  const corruption = form.watch("corruption");

  // 1. CÁLCULOS (MEMOIZED)
  const calculations = useMemo(() => {
    // Mantemos leitura de atributos caso precise para outra coisa, mas não para os limiares
    const strong = Number(attributes?.vigorous?.value || 0);

    // Redução de Dano (Soma simples de valores numéricos nas armaduras)
    const damageReduction = armors.reduce((acc: number, item: any) => {
        const protectionValue = parseInt(item.protection);
        return acc + (isNaN(protectionValue) ? 0 : protectionValue);
    }, 0);

    // Vida Máxima (Mantemos o cálculo base ou 10, mas aceitando modificadores)
    // Se quiser manual total na vida maxima também, avise. Por enquanto mantive a base de Strong.
    const maxHpBase = Math.max(10, strong);
    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // Corrupção Total Atual
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      // Valores manuais com fallback para 0 se estiverem vazios
      painThreshold: Number(manualPainThreshold) || 0,
      corruptionThreshold: Number(manualCorruptionThreshold) || 0,
      totalDefense: Number(manualDefense) || 0,
      
      toughnessMax,
      totalCorruption,
      damageReduction
    };
  }, [attributes, toughnessMaxMod, armors, corruption, manualDefense, manualPainThreshold, manualCorruptionThreshold]);


  // 2. GUARDIÃO DE ESTADO
  useEffect(() => {
    const currentToughness = form.getValues("toughness.current");
    const max = calculations.toughnessMax;

    // Inicialização segura
    if (currentToughness === undefined || currentToughness === null) {
        form.setValue("toughness.current", max);
        return; 
    }

    // Clamping (Cortar excesso de vida)
    if (currentToughness > max) {
        form.setValue("toughness.current", max, { shouldDirty: true, shouldTouch: true });
    }
  }, [calculations.toughnessMax, form]);

  return calculations;
};