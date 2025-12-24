import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext"; 
import { useMemo, useEffect } from "react";

export const useNpcCalculations = () => {
  const { form } = useSymbaroumNpcSheet();

  // Observar mudanças
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  const abilities = form.watch("abilities") || []; 
  const manualDefense = form.watch("combat.defense");
  const manualPainThreshold = form.watch("combat.pain_threshold");
  const manualCorruptionThreshold = form.watch("combat.corruption_threshold"); 
  const toughnessMaxMod = form.watch("combat.toughness_max");
  const corruption = form.watch("corruption");
  const rawCurrentToughness = form.watch("combat.toughness_current");
  const currentToughness = Number(rawCurrentToughness) || 0;

  const calculations = useMemo(() => {
    // 1. Atributo Base (Vigoroso/Forte)
    let strong = Number(attributes?.vigorous?.value || attributes?.strong?.value || 0);

    // 2. Detectar Amoque/Berserk Ativo
    // Nota: Verificamos se a habilidade existe e se está marcada como ativa (isActive)
    const activeBerserk = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("amoque") || a.name?.toLowerCase().includes("berserk")) && a.isActive
    );

    const featOfStrength = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("façanha de força") || a.name?.toLowerCase().includes("feat of strength")) && a.isActive
    );

    // 3. CÁLCULO DE REDUÇÃO DE DANO (ARMADURA)
    let baseDR = armors.reduce((acc: number, item: any) => {
        if (!item.equipped) return acc; 
        const protectionValue = parseInt(item.protection);
        return acc + (isNaN(protectionValue) ? 0 : Math.abs(protectionValue));
    }, 0);

    // APLICAÇÃO DO AMOQUE NA PROTEÇÃO
    if (activeBerserk) {
        const level = activeBerserk.level?.toLowerCase();
        if (level === "mestre" || level === "master") baseDR += 4;
        else if (level === "adepto" || level === "adept") baseDR += 3;
        else baseDR += 2; // Noviço/Novato
    }

    // 4. CÁLCULO DE DEFESA
    let finalDefense = Number(manualDefense) || 0;
    
    // APLICAÇÃO DO AMOQUE NA DEFESA
    // Em Symbaroum, a defesa base vira 5. No sistema de modificadores de NPC (Base - 10), isso é -5.
    if (activeBerserk) {
        finalDefense = -5;
    }

    // 5. VIDA MÁXIMA
    let maxHpBase = Math.max(10, strong);
    if (featOfStrength) maxHpBase = strong + 5;
    const toughnessMax = Number(toughnessMaxMod) || maxHpBase; 

    // 6. CORRUPÇÃO E LIMIARES
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);
    const resolute = Number(attributes?.resolute?.value || 0);

    return {
      painThreshold: Number(manualPainThreshold) || Math.ceil(strong / 2) || 5,
      corruptionThreshold: Number(manualCorruptionThreshold) || Math.ceil(resolute / 2) || 4,
      totalDefense: finalDefense,
      damageReduction: baseDR,
      toughnessMax,
      totalCorruption,
      activeBerserk: !!activeBerserk,
      isBloodied: currentToughness <= (toughnessMax / 2)
    };
  }, [
    attributes, 
    toughnessMaxMod, 
    JSON.stringify(armors), 
    corruption, 
    manualDefense, 
    manualPainThreshold, 
    manualCorruptionThreshold,
    JSON.stringify(abilities), 
    currentToughness
  ]);

  // Efeito para manter a vida dentro dos limites
  useEffect(() => {
    const max = calculations.toughnessMax;
    if (currentToughness > max) {
        form.setValue("combat.toughness_current", max, { shouldDirty: true });
    }
  }, [calculations.toughnessMax, currentToughness, form]);

  return calculations;
};