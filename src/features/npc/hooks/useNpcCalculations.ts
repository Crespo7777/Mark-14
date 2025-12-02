import { useNpcSheet } from "../NpcSheetContext";
import { useMemo } from "react";

export const useNpcCalculations = () => {
  const { form } = useNpcSheet();

  // Observar mudanças no formulário
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  
  // Defesa agora é manual (vem de stats ou um campo específico)
  // Assumimos que existe um campo 'stats.defense' ou usamos um valor base
  const manualDefense = form.watch("stats.defense"); 
  
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);
  const corruption = form.watch("corruption");

  const calculations = useMemo(() => {
    // 1. Atributos Básicos
    const strong = Number(attributes?.vigorous?.value || 0);
    const resolute = Number(attributes?.resolute?.value || 0);

    // 2. Limiar de Dor
    const basePainThreshold = Math.ceil(strong / 2);
    const painThreshold = Math.max(1, basePainThreshold + painThresholdBonus);

    // 3. Redução de Dano (DR) - Soma as proteções fixas
    const damageReduction = armors.reduce((acc: number, item: any) => {
        // Tenta converter a string de proteção para numero (ex: "3" vira 3, "1d4" vira 0)
        const protectionValue = parseInt(item.protection);
        return acc + (isNaN(protectionValue) ? 0 : protectionValue);
    }, 0);

    // 4. Vida Máxima
    const maxHpBase = Math.max(10, strong);
    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // 5. Corrupção
    const corruptionThreshold = Math.ceil(resolute / 2);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      strong,
      resolute,
      painThreshold,
      // Se manualDefense for nulo, assume 0.
      totalDefense: Number(manualDefense) || 0, 
      toughnessMax,
      corruptionThreshold,
      totalCorruption,
      damageReduction // Novo campo exportado
    };
  }, [attributes, toughnessMaxMod, painThresholdBonus, armors, corruption, manualDefense]);

  return calculations;
};