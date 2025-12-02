// src/features/npc/hooks/useNpcCalculations.ts

import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { NpcSheetData } from "../npc.schema";

export const useNpcCalculations = (form: UseFormReturn<NpcSheetData>) => {
  const attributes = form.watch("attributes");
  const painThresholdBonus = Number(form.watch("combat.pain_threshold_bonus") || 0);
  const corruption = form.watch("corruption");
  const resolute = Number(attributes?.resolute?.value || 0);

  const calculations = useMemo(() => {
    // 1. Atributos Base
    const strong = Number(attributes?.vigorous?.value || 0);

    // 2. Limiar de Dor (Pain Threshold)
    // Regra: Strong / 2 (arredondado para cima) + Bônus
    const basePainThreshold = Math.ceil(strong / 2);
    const painThreshold = Math.max(1, basePainThreshold + painThresholdBonus);

    // 3. Vida Máxima (Padrão: Strong ou 10, o que for maior)
    // Nota: Se quiser permitir edição manual total da vida máxima, 
    // podemos remover isso, mas geralmente segue essa regra.
    const toughnessMax = Math.max(10, strong);

    // 4. Corrupção
    const corruptionThreshold = Math.ceil(resolute / 2);

    return {
      toughnessMax,
      painThreshold,
      corruptionThreshold
    };
  }, [attributes, painThresholdBonus, corruption]);

  return calculations;
};