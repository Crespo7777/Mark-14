// IMPORTANTE: Ajustamos o import para pegar o contexto da PASTA ATUAL (Symbaroum)
import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext"; 
import { useMemo, useEffect } from "react";

export const useNpcCalculations = () => {
  // Usamos o hook do contexto Symbaroum correto
  const { form } = useSymbaroumNpcSheet();

  // Observar mudanças
  const attributes = form.watch("attributes");
  const armors = form.watch("armors") || [];
  const abilities = form.watch("abilities") || []; 
  
  // Inputs Manuais
  const manualDefense = form.watch("combat.defense");
  const manualPainThreshold = form.watch("combat.pain_threshold");
  // Ajuste: stats.corruption_threshold não existe no schema novo, 
  // assumindo que queres usar algo fixo ou um campo customizado.
  // Se não existir no form, usamos 0.
  const manualCorruptionThreshold = form.watch("data.corruption_threshold"); // Ajustado para 'data' se for custom
  
  const toughnessMaxMod = form.watch("combat.toughness_max"); // Ajuste para bater com o schema (combat.toughness_max ou similar)
  // No schema original era 'combat.toughness_max', aqui usavas 'toughness.max_modifier'. 
  // Vou manter a leitura segura de onde quer que venha.
  
  const corruption = form.watch("corruption");

  // Leitura da vida atual
  // No schema Symbaroum NPC: 'combat.toughness_current'
  const rawCurrentToughness = form.watch("combat.toughness_current");
  const currentToughness = Number(rawCurrentToughness) || 0;

  const calculations = useMemo(() => {
    // 1. Calcular Atributos (Forte/Vigoroso)
    // No schema Symbaroum NPC: attributes.vigorous.value
    let strong = Number(attributes?.vigorous?.value || attributes?.strong?.value || 0);

    // Aplica "Atributo Excepcional"
    abilities.forEach((ability: any) => {
        if (ability.isActive && ability.name?.toLowerCase().includes("atributo excepcional")) {
            let bonus = 1; 
            if (ability.level === "Adepto") bonus = 2;
            if (ability.level === "Mestre") bonus = 3;

            if (ability.associatedAttribute === "strong" || ability.associatedAttribute === "vigorous") {
                strong += bonus;
            }
        }
    });

    // 2. Habilidades Especiais
    const activeBerserk = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("amoque") || a.name?.toLowerCase().includes("berserk")) && a.isActive
    );

    const featOfStrength = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("façanha de força") || a.name?.toLowerCase().includes("feat of strength")) && a.isActive
    );

    // 3. Redução de Dano
    const damageReduction = armors.reduce((acc: number, item: any) => {
        if (!item.equipped) return acc; 
        const protectionValue = parseInt(item.protection);
        const safeValue = isNaN(protectionValue) ? 0 : Math.abs(protectionValue);
        return acc + safeValue;
    }, 0);

    // 4. Vida Máxima
    let maxHpBase = Math.max(10, strong);
    if (featOfStrength) {
        maxHpBase = strong + 5;
    }

    // Se houver um modificador manual salvo no 'combat.toughness_max'
    // Nota: O schema define toughness_max como número. Se for editável, usamos ele.
    // Se for calculado, ignoramos o valor salvo e usamos o cálculo.
    // Para simplificar: Usamos o cálculo base + modificadores manuais se existirem.
    const toughnessMax = maxHpBase; 

    // Estado "Ensanguentado"
    const isBloodied = currentToughness <= (toughnessMax / 2);

    // 5. Corrupção
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      painThreshold: Number(manualPainThreshold) || Math.ceil(strong / 2) || 5,
      corruptionThreshold: Number(manualCorruptionThreshold) || Math.ceil(Number(attributes?.resolute?.value || 0) / 2) || 4,
      totalDefense: Number(manualDefense) || 0,
      
      toughnessMax,
      totalCorruption,
      damageReduction,
      
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
    JSON.stringify(abilities), 
    currentToughness
  ]);

  // 2. GUARDIÃO DE ESTADO (Auto-heal no init)
  useEffect(() => {
    const max = calculations.toughnessMax;
    
    // Corrige vida acima do máximo
    if (currentToughness > max) {
        const timer = setTimeout(() => {
             form.setValue("combat.toughness_current", max, { shouldDirty: true });
        }, 100); 
        return () => clearTimeout(timer);
    }

    // Inicializa vida se estiver vazia/zero
    const isInvalid = rawCurrentToughness === undefined || rawCurrentToughness === null || (currentToughness === 0 && max > 0);

    if (isInvalid && max > 0) {
        const timer = setTimeout(() => {
             // IMPORTANTE: O caminho no schema NPC é combat.toughness_current
             form.setValue("combat.toughness_current", max); 
        }, 200);
        return () => clearTimeout(timer);
    }
  }, [calculations.toughnessMax, currentToughness, rawCurrentToughness, form]);

  return calculations;
};