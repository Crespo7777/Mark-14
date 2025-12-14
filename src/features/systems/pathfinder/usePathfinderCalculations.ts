import { useMemo } from "react";
import { PathfinderSheetData } from "./pathfinder.schema";

const getRankBonus = (rank: string) => {
  switch (rank) {
    case "T": return 2;
    case "E": return 4;
    case "M": return 6;
    case "L": return 8;
    default: return 0;
  }
};

export const usePathfinderCalculations = (data: PathfinderSheetData) => {
  return useMemo(() => {
    // 1. Atributos e Modificadores
    const getMod = (score: number) => Math.floor((score - 10) / 2);
    
    // Fallback seguro
    const abs = data.abilities || {};
    const mods: Record<string, number> = {
      str: getMod(abs.str?.value || 10),
      dex: getMod(abs.dex?.value || 10),
      con: getMod(abs.con?.value || 10),
      int: getMod(abs.int?.value || 10),
      wis: getMod(abs.wis?.value || 10),
      cha: getMod(abs.cha?.value || 10),
    };

    const level = data.level || 1;

    const calcBonus = (rank: string, abilityMod: number, item = 0, misc = 0) => {
      const profBonus = (!rank || rank === "U") ? 0 : getRankBonus(rank) + level;
      return abilityMod + profBonus + (Number(item) || 0) + (Number(misc) || 0);
    };

    // 2. Defesas
    const dexCap = data.ac?.cap ?? 99;
    const dexForAC = Math.min(mods.dex, dexCap);
    const acRank = data.ac?.rank || "U";
    const acProf = acRank === "U" ? 0 : getRankBonus(acRank) + level;
    const acTotal = 10 + dexForAC + acProf + (Number(data.ac?.item) || 0) + (Number(data.ac?.shield) || 0) + (Number(data.ac?.misc) || 0);

    const saves = {
      fortitude: calcBonus(data.saves?.fortitude?.rank || "U", mods.con, data.saves?.fortitude?.item, data.saves?.fortitude?.misc),
      reflex: calcBonus(data.saves?.reflex?.rank || "U", mods.dex, data.saves?.reflex?.item, data.saves?.reflex?.misc),
      will: calcBonus(data.saves?.will?.rank || "U", mods.wis, data.saves?.will?.item, data.saves?.will?.misc),
    };

    // 3. Percepção e Class DC
    const perception = calcBonus(data.perception?.rank || "U", mods.wis, data.perception?.item, data.perception?.misc);
    
    const keyAttrStr = data.attributes?.class_dc?.key_attr || "str";
    const keyAttrMod = mods[keyAttrStr] || 0;
    const classDC = 10 + calcBonus(data.attributes?.class_dc?.rank || "U", keyAttrMod, data.attributes?.class_dc?.item, data.attributes?.class_dc?.misc);

    // 4. Perícias
    const skills: Record<string, number> = {};
    const skillList = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"];
    
    skillList.forEach(key => {
        let mod = mods.int;
        if (["athletics"].includes(key)) mod = mods.str;
        if (["acrobatics", "stealth", "thievery"].includes(key)) mod = mods.dex;
        if (["deception", "diplomacy", "intimidation", "performance"].includes(key)) mod = mods.cha;
        if (["medicine", "nature", "religion", "survival"].includes(key)) mod = mods.wis;

        const s = (data.skills as any)?.[key];
        if (s) {
            skills[key] = calcBonus(s.rank, mod, s.item, s.misc) - (Number(s.armor) || 0);
        } else {
            skills[key] = mod;
        }
    });

    const lores = (data.lores || []).map(lore => ({
        ...lore,
        total: calcBonus(lore.rank, mods.int, lore.item, lore.misc)
    }));

    // 5. CÁLCULO DE CARGA (BULK) - CRÍTICO PARA O INVENTÁRIO
    const totalBulk = (data.inventory || []).reduce((acc: number, item: any) => {
        const q = Number(item.quantity) || 0;
        const bStr = String(item.bulk || "0").toUpperCase();
        // L (Light) conta como 0.1
        const b = bStr === "L" ? 0.1 : (parseFloat(bStr) || 0);
        return acc + (b * q);
    }, 0);

    const encumberedLimit = 5 + mods.str;
    const maxBulkLimit = 10 + mods.str;

    // 6. Ataque Mágico
    const spellKey = data.spellcasting?.key_attribute || "intelligence";
    // Mapeamento simples para garantir chaves curtas (str, dex, etc)
    const attrMap: Record<string, string> = { 
        intelligence: "int", wisdom: "wis", charisma: "cha", 
        strength: "str", dexterity: "dex", constitution: "con" 
    };
    const shortKey = attrMap[spellKey] || "int";
    const spellMod = mods[shortKey] || 0;
    
    const spellProfRank = data.spellcasting?.proficiency || "U";
    const spellProfBonus = spellProfRank === "U" ? 0 : getRankBonus(spellProfRank) + level;
    
    const spellAttack = spellMod + spellProfBonus + (Number(data.spellcasting?.attack) || 0);
    const spellDC = 10 + spellAttack + (Number(data.spellcasting?.dc) || 0);

    // RETORNO COMPLETO
    return { 
        mods, 
        level, 
        acTotal, 
        saves, 
        perception, 
        skills, 
        lores, 
        classDC,
        // ESTE OBJETO TEM DE ESTAR AQUI:
        bulk: { total: totalBulk, encumbered: encumberedLimit, max: maxBulkLimit },
        magic: { attack: spellAttack, dc: spellDC }
    };
  }, [data]);
};