import { useNpcSheet } from "../NpcSheetContext";
import { useMemo, useEffect } from "react";

export const useNpcCalculations = () => {
  const { form } = useNpcSheet();

  // Observar mudanças
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  const abilities = form.watch("abilities") || []; // <--- IMPORTANTE: Observar habilidades
  
  // Inputs Manuais
  const manualDefense = form.watch("combat.defense");
  const manualPainThreshold = form.watch("combat.pain_threshold");
  const manualCorruptionThreshold = form.watch("stats.corruption_threshold");
  
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  const corruption = form.watch("corruption");

  // Vigilância da Vida Atual (para isBloodied e Guardião)
  const currentToughness = Number(form.watch("toughness.current"));

  const calculations = useMemo(() => {
    // 1. Calcular Atributos com Bónus (Atributo Excepcional)
    // Começamos com os valores base
    let strong = Number(attributes?.vigorous?.value || attributes?.strong?.value || 0);
    // Nota: Para NPCs, usamos principalmente o Forte para a Vida. 
    // Se precisares de outros atributos para lógica futura, podes adicionar aqui.

    // Aplica "Atributo Excepcional" se existir
    abilities.forEach((ability: any) => {
        if (ability.isActive && ability.name?.toLowerCase().includes("atributo excepcional")) {
            let bonus = 1; 
            if (ability.level === "Adepto") bonus = 2;
            if (ability.level === "Mestre") bonus = 3;

            // Verifica se afeta o Vigoroso/Forte
            if (ability.associatedAttribute === "strong" || ability.associatedAttribute === "vigorous") {
                strong += bonus;
            }
        }
    });

    // 2. Detetar Habilidades Especiais Ativas
    const activeBerserk = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("amoque") || a.name?.toLowerCase().includes("berserk")) && a.isActive
    );

    const featOfStrength = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("façanha de força") || a.name?.toLowerCase().includes("feat of strength")) && a.isActive
    );

    // 3. Redução de Dano (Soma das Armaduras)
    const damageReduction = armors.reduce((acc: number, item: any) => {
        if (!item.equipped) return acc; 
        const protectionValue = parseInt(item.protection);
        const safeValue = isNaN(protectionValue) ? 0 : Math.abs(protectionValue);
        return acc + safeValue;
    }, 0);

    // 4. Vida Máxima (Com Lógica de Façanha de Força)
    let maxHpBase = Math.max(10, strong);
    
    // Regra Façanha de Força (Novato): Vida = Forte + 5
    if (featOfStrength) {
        maxHpBase = strong + 5;
    }

    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    // Estado "Ensanguentado" (Meia Vida)
    const isBloodied = currentToughness <= (toughnessMax / 2);

    // 5. Corrupção Total
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      // Valores manuais ou calculados
      painThreshold: Number(manualPainThreshold) || Math.ceil(strong / 2) || 5,
      corruptionThreshold: Number(manualCorruptionThreshold) || 4, // NPCs costumam ter fixo ou baseado em Resoluto
      totalDefense: Number(manualDefense) || 0, // NPCs usam defesa manual definida pelo Mestre
      
      toughnessMax,
      totalCorruption,
      damageReduction,
      
      // Exportar dados para a lógica de combate
      activeBerserk,
      featOfStrength,
      isBloodied
    };
  }, [
    attributes, 
    toughnessMaxMod, 
    JSON.stringify(armors), 
    corruption, 
    manualDefense, 
    manualPainThreshold, 
    manualCorruptionThreshold,
    JSON.stringify(abilities), // <--- Recalcula se habilidades mudarem
    currentToughness // <--- Recalcula se vida mudar (para isBloodied)
  ]);

  // 2. GUARDIÃO DE ESTADO
  useEffect(() => {
    const max = calculations.toughnessMax;
    if (currentToughness > max) {
        const timer = setTimeout(() => {
             form.setValue("toughness.current", max, { shouldDirty: true, shouldTouch: true });
        }, 100); 
        return () => clearTimeout(timer);
    }
    if ((currentToughness === undefined || currentToughness === null) && max > 0) {
        const timer = setTimeout(() => {
             form.setValue("toughness.current", max); 
        }, 200);
        return () => clearTimeout(timer);
    }
  }, [calculations.toughnessMax, currentToughness, form]);

  return calculations;
};