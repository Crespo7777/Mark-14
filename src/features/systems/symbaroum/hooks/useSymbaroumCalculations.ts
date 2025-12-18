import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { useMemo, useEffect } from "react";

export const useSymbaroumCalculations = () => {
  const { form } = useCharacterSheet();

  const attributes = form.watch("attributes");
  const toughnessMaxMod = form.watch("toughness.max_modifier");
  
  const weapons = form.watch("weapons") || []; 
  const armors = form.watch("armors") || [];
  const inventory = form.watch("inventory") || [];
  const projectiles = form.watch("projectiles") || [];
  const abilities = form.watch("abilities") || []; 
  
  const experience = form.watch("experience");
  const corruption = form.watch("corruption");
  const painThresholdBonus = Number(form.watch("painThresholdBonus") || 0);

  const parseWeight = (value: string | number | undefined): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const cleanString = value.toString().replace(",", ".").trim();
    const result = parseFloat(cleanString);
    return isNaN(result) ? 0 : result;
  };

  const calculations = useMemo(() => {
    // 1. Ler Atributos BASE da Ficha
    let strong = Number(attributes?.strong?.value || attributes?.strong || attributes?.vigorous?.value || attributes?.vigorous || 0);
    let quick = Number(attributes?.quick?.value || attributes?.quick || 0);
    let resolute = Number(attributes?.resolute?.value || attributes?.resolute || 0);
    let vigilant = Number(attributes?.vigilant?.value || attributes?.vigilant || 0);
    let persuasive = Number(attributes?.persuasive?.value || attributes?.persuasive || 0);
    let cunning = Number(attributes?.cunning?.value || attributes?.cunning || 0);
    let discreet = Number(attributes?.discreet?.value || attributes?.discreet || 0);
    let precise = Number(attributes?.precise?.value || attributes?.precise || 0);

    // --- CÁLCULO DE PONTOS RESTANTES (Adicionado para AttributesTab) ---
    // Assumindo 80 pontos iniciais padrão
    const totalAttributes = strong + quick + resolute + vigilant + persuasive + cunning + discreet + precise;
    const remainingAttributePoints = 80 - totalAttributes;

    // --- 2. APLICAÇÃO DE BÓNUS DE "ATRIBUTO EXCEPCIONAL" ---
    abilities.forEach((ability: any) => {
        if (ability.isActive && ability.name?.toLowerCase().includes("atributo excepcional")) {
            let bonus = 1;
            if (ability.level === "Adepto") bonus = 2;
            if (ability.level === "Mestre") bonus = 3;

            switch (ability.associatedAttribute) {
                case "strong": case "vigorous": strong += bonus; break;
                case "quick": quick += bonus; break;
                case "resolute": resolute += bonus; break;
                case "vigilant": vigilant += bonus; break;
                case "persuasive": persuasive += bonus; break;
                case "cunning": cunning += bonus; break;
                case "discreet": discreet += bonus; break;
                case "precise": precise += bonus; break;
            }
        }
    });

    const activeBerserk = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("amoque") || a.name?.toLowerCase().includes("berserk")) && a.isActive
    );

    const featOfStrength = abilities.find((a: any) => 
        (a.name?.toLowerCase().includes("façanha de força") || a.name?.toLowerCase().includes("feat of strength")) && a.isActive
    );

    // --- 4. CÁLCULOS DERIVADOS ---
    let defensiveQuick = quick;
    if (activeBerserk) {
        if (activeBerserk.level === "Novato" || activeBerserk.level === "Adepto") {
            defensiveQuick = 5; 
        }
    }

    const equippedArmors = armors.filter((a: any) => a.equipped);
    const totalObstructive = equippedArmors.reduce((acc: number, item: any) => {
        let valString = String(item.obstructive || "0").replace(",", ".");
        let val = parseFloat(valString);
        if (isNaN(val)) val = 0;
        return acc + Math.abs(val);
    }, 0);
    
    const defense = defensiveQuick - totalObstructive;

    const basePainThreshold = Math.ceil(strong / 2);
    const painThreshold = Math.max(1, basePainThreshold + painThresholdBonus);

    let maxHpBase = Math.max(10, strong);
    if (featOfStrength) {
        maxHpBase = strong + 5;
    }

    const bonusHp = Number(toughnessMaxMod) || 0;
    const toughnessMax = maxHpBase + bonusHp;

    const currentHp = Number(form.getValues("toughness.current")) || 0;
    const isBloodied = currentHp <= (toughnessMax / 2);

    const inventoryWeight = inventory.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const projectilesWeight = projectiles.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const weaponsWeight = weapons.reduce((acc: number, item: any) => acc + parseWeight(item.weight), 0);
    const armorsWeight = 0; 

    const totalWeight = inventoryWeight + projectilesWeight + weaponsWeight + armorsWeight;
    const maxLoad = strong > 0 ? strong : 10;
    
    let encumbranceStatus = "Leve";
    if (totalWeight > maxLoad) encumbranceStatus = "Sobrecarregado";
    else if (totalWeight > maxLoad / 2) encumbranceStatus = "Pesado";

    const currentXp = (Number(experience?.total) || 0) - (Number(experience?.spent) || 0);
    const corruptionThreshold = Math.ceil(resolute / 2);
    const totalCorruption = (Number(corruption?.temporary) || 0) + (Number(corruption?.permanent) || 0);

    return {
      strong, quick, resolute, vigilant, persuasive, cunning, discreet, precise,
      painThreshold,
      defense,
      totalDefense: defense,
      armorImpeding: totalObstructive,
      totalWeight,
      maxLoad,
      encumbranceStatus,
      currentExperience: currentXp,
      corruptionThreshold,
      totalCorruption,
      toughnessMax,
      activeBerserk,
      featOfStrength,
      isBloodied,
      remainingAttributePoints // <--- Novo export importante
    };
  }, [
    attributes, 
    toughnessMaxMod, 
    JSON.stringify(armors),
    JSON.stringify(weapons),
    JSON.stringify(inventory),
    JSON.stringify(projectiles),
    experience,
    corruption, 
    painThresholdBonus,
    JSON.stringify(abilities), 
    form.watch("toughness.current") 
  ]);

  useEffect(() => {
      const currentVal = Number(form.getValues("toughness.current")) || 0;
      if (currentVal > calculations.toughnessMax) {
          const timer = setTimeout(() => {
              form.setValue("toughness.current", calculations.toughnessMax, { shouldDirty: true });
          }, 0);
          return () => clearTimeout(timer);
      }
  }, [calculations.toughnessMax, form]); 

  return calculations;
};