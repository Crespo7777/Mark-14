import { useMemo } from "react";
import { PathfinderSheetData } from "./pathfinder.schema";

// Helper de Nível de Proficiência (Fora do hook para não recriar)
const getProfBonus = (rank: string, level: number) => {
  if (!rank || rank === "U") return 0;
  const map: Record<string, number> = { T: 2, E: 4, M: 6, L: 8 };
  return (map[rank] || 0) + level;
};

// Helper de Modificador
const getMod = (score: number) => Math.floor((score - 10) / 2);

export const usePathfinderCalculations = (data: PathfinderSheetData) => {
  
  const level = data.level || 1;

  // 1. CONDIÇÕES & PENALIDADES GLOBAIS
  // Otimização: Só roda se active_conditions mudar
  const { globalPenalties, modPenalties, conditionsState } = useMemo(() => {
    const conds = data.active_conditions || [];
    const getVal = (slug: string) => conds.find(c => c.slug === slug && c.active)?.value || 0;

    // Regra: Penalidades de Status não empilham.
    const frightened = getVal("frightened");
    const sickened = getVal("sickened");
    const globalPenalty = Math.max(frightened, sickened) * -1; // -X

    return {
      globalPenalties: {
        all_checks: globalPenalty, // Afeta skills, attacks, saves, DCs
        ac: globalPenalty,         // AC também sofre (Status penalty to AC)
        dc: globalPenalty
      },
      modPenalties: {
        str: getVal("enfeebled") * -1,
        dex: getVal("clumsy") * -1,
        int: getVal("stupefied") * -1,
        wis: getVal("stupefied") * -1,
        cha: getVal("stupefied") * -1,
      },
      conditionsState: {
        isFlatFooted: getVal("flat_footed") > 0 || getVal("prone") > 0,
        isProne: getVal("prone") > 0,
        isShieldRaised: getVal("raised_shield") > 0,
      }
    };
  }, [data.active_conditions]);

  // 2. ATRIBUTOS (BASE + STATUS)
  // Otimização: Só roda se abilities base ou penalidades mudarem
  const { mods, rawMods } = useMemo(() => {
    const abs = data.abilities || {};
    
    const raw = {
      str: getMod(abs.str?.value || 10),
      dex: getMod(abs.dex?.value || 10),
      con: getMod(abs.con?.value || 10),
      int: getMod(abs.int?.value || 10),
      wis: getMod(abs.wis?.value || 10),
      cha: getMod(abs.cha?.value || 10),
    };

    // Nota: Regra RAW diz que penalidade afeta o "check", não o atributo.
    // Mas para facilitar a UI, aplicamos aqui para propagar para as perícias.
    const effective = {
      str: raw.str + globalPenalties.all_checks + modPenalties.str,
      dex: raw.dex + globalPenalties.all_checks + modPenalties.dex,
      con: raw.con + globalPenalties.all_checks, // Con geralmente não tem check direto além de Fort
      int: raw.int + globalPenalties.all_checks + modPenalties.int,
      wis: raw.wis + globalPenalties.all_checks + modPenalties.wis,
      cha: raw.cha + globalPenalties.all_checks + modPenalties.cha,
    };

    return { mods: effective, rawMods: raw };
  }, [data.abilities, globalPenalties.all_checks, modPenalties]);

  // 3. DEFESA (AC)
  // Otimização: Depende de Inventory (armaduras), AC prof e Mods Dex.
  const { acTotal, acBreakdown } = useMemo(() => {
    // Procura armadura equipada
    const equippedArmor = data.inventory?.armors?.find(a => a.equipped);
    const itemBonus = equippedArmor ? (Number(equippedArmor.ac_bonus) || 0) : (Number(data.ac?.item) || 0);
    const dexCap = equippedArmor ? (Number(equippedArmor.dex_cap) ?? 99) : (Number(data.ac?.cap) ?? 99);
    
    // Penalidade de Clumsy afeta Dex checks, mas não necessariamente o Cap. 
    // Usaremos Raw Dex para o Cap, mas aplicamos Clumsy como Status Penalty na AC (já incluso em globalPenalties.ac).
    // Espera... Clumsy é status penalty to Dex-based checks and AC.
    // Regra correta: 10 + Dex(capped) + Prof + Item + Status(Clumsy) + Circ(Shield/Flatfooted)
    
    const dexBonus = Math.min(rawMods.dex, dexCap); 
    const profRank = data.ac?.rank || "U";
    const profBonus = getProfBonus(profRank, level);
    
    const shieldBonus = conditionsState.isShieldRaised ? 2 : (Number(data.ac?.shield) || 0);
    const flatFootedMalus = conditionsState.isFlatFooted ? -2 : 0;
    
    // globalPenalties.ac inclui Clumsy ou Frightened (o pior dos dois)
    const total = 10 + dexBonus + profBonus + itemBonus + shieldBonus + flatFootedMalus + globalPenalties.ac + (Number(data.ac?.misc) || 0);

    return { 
      acTotal: total,
      acBreakdown: { dexBonus, profBonus, itemBonus, shieldBonus, flatFootedMalus, status: globalPenalties.ac }
    };
  }, [data.inventory?.armors, data.ac, rawMods.dex, level, conditionsState, globalPenalties.ac]);

  // 4. SAVES, PERCEPÇÃO & CLASS DC
  const derivedStats = useMemo(() => {
    const calc = (rank: string, mod: number, item = 0, misc = 0) => {
        return mod + getProfBonus(rank, level) + (Number(item)||0) + (Number(misc)||0);
    };

    return {
        saves: {
            fortitude: calc(data.saves?.fortitude?.rank || "U", mods.con, data.saves?.fortitude?.item, data.saves?.fortitude?.misc),
            reflex: calc(data.saves?.reflex?.rank || "U", mods.dex, data.saves?.reflex?.item, data.saves?.reflex?.misc),
            will: calc(data.saves?.will?.rank || "U", mods.wis, data.saves?.will?.item, data.saves?.will?.misc),
        },
        perception: calc(data.perception?.rank || "U", mods.wis, data.perception?.item, data.perception?.misc),
        classDC: 10 + calc(data.attributes?.class_dc?.rank || "U", mods[data.attributes?.class_dc?.key_attr as keyof typeof mods] || 0, data.attributes?.class_dc?.item, data.attributes?.class_dc?.misc)
    };
  }, [data.saves, data.perception, data.attributes, mods, level]);

  // 5. PERÍCIAS (SKILLS)
  const skills = useMemo(() => {
    const result: Record<string, number> = {};
    const skillList = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"];
    
    // Mapa de Atributo Chave
    const keyAttr: Record<string, keyof typeof mods> = {
        athletics: "str",
        acrobatics: "dex", stealth: "dex", thievery: "dex",
        arcana: "int", crafting: "int", occultism: "int", society: "int",
        medicine: "wis", nature: "wis", religion: "wis", survival: "wis",
        deception: "cha", diplomacy: "cha", intimidation: "cha", performance: "cha"
    };

    // Penalidade de Armadura (Armor Check Penalty - ACP)
    // Aplica apenas em Str e Dex skills
    const equippedArmor = data.inventory?.armors?.find(a => a.equipped);
    const acp = equippedArmor ? (Number(equippedArmor.check_penalty) || 0) : 0; 
    // Nota: ACP é geralmente um número negativo no DB (ex: -2). Se for positivo, multiplicar por -1.
    // Vamos assumir que vem negativo ou 0.

    skillList.forEach(key => {
        const attr = keyAttr[key];
        const effectiveMod = mods[attr]; // Já inclui penalidades de status (Frightened, Enfeebled, etc)
        const s = (data.skills as any)?.[key];
        
        let total = effectiveMod;
        
        if (s) {
            const prof = getProfBonus(s.rank, level);
            const item = (Number(s.item) || 0) + (Number(s.misc) || 0);
            
            // Aplica ACP se for Str ou Dex
            const armorPen = (attr === "str" || attr === "dex") ? acp : 0;
            
            total += prof + item + armorPen;
        }
        result[key] = total;
    });
    return result;
  }, [data.skills, data.inventory?.armors, mods, level]);

  // 6. CARGA (BULK)
  const bulk = useMemo(() => {
    let total = 0;
    const calcItem = (items: any[]) => {
        if(!Array.isArray(items)) return;
        items.forEach(item => {
            const qty = Number(item.quantity) || 0;
            const bStr = String(item.bulk || "0").toUpperCase();
            let weight = 0;
            if (bStr === "L") weight = 0.1;
            else if (bStr !== "-" && bStr !== "") weight = parseFloat(bStr) || 0;
            total += weight * qty;
        });
    };

    // Suporta tanto o formato novo (objeto) quanto o antigo (array solto, caso exista)
    if (Array.isArray(data.inventory)) {
        calcItem(data.inventory);
    } else {
        calcItem(data.inventory?.weapons);
        calcItem(data.inventory?.armors);
        calcItem(data.inventory?.gear);
    }

    // Regra: Enfeebled não reduz a Carga Máxima (regra RAW), apenas os testes.
    // No entanto, se quiseres aplicar house rule, altera para 'mods.str'. Usaremos 'rawMods.str' (base).
    const encumbered = 5 + rawMods.str;
    const max = 10 + rawMods.str;

    return { total: Math.floor(total * 10) / 10, encumbered, max };
  }, [data.inventory, rawMods.str]);

  // 7. MAGIA
  const magic = useMemo(() => {
    const spellKey = data.spellcasting?.key_attribute || "intelligence";
    const attrMap: Record<string, keyof typeof mods> = { intelligence: "int", wisdom: "wis", charisma: "cha" };
    const shortKey = attrMap[spellKey] || "int";
    
    // Penalidade mental específica (Stupefied) já está em mods[shortKey]
    // Mas precisamos verificar se já não aplicamos globalPenalties duas vezes
    // mods[int] = raw + global(-1) + stupefied(-1).
    // Spell Attack = mod + prof. Correto.
    
    const attack = (mods[shortKey] || 0) + getProfBonus(data.spellcasting?.proficiency || "U", level) + (Number(data.spellcasting?.attack) || 0);
    const dc = 10 + attack + (Number(data.spellcasting?.dc) || 0);
    
    return { attack, dc };
  }, [data.spellcasting, mods, level]);

  return {
    level,
    mods,
    rawMods,
    acTotal,
    acBreakdown,
    saves: derivedStats.saves,
    perception: derivedStats.perception,
    classDC: derivedStats.classDC,
    skills,
    lores: (data.lores || []).map(l => ({...l, total: getProfBonus(l.rank, level) + mods.int })), // Simplificado
    bulk,
    magic,
    combatPenalties: {
        prone: conditionsState.isProne ? -2 : 0,
        enfeebled: modPenalties.str // Útil para UI de ataque melee
    }
  };
};