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
    // 0. PROCESSAR CONDIÇÕES (A MAGIA ACONTECE AQUI)
    const conditions = data.active_conditions || [];
    
    const getCondVal = (slug: string) => {
        const cond = conditions.find(c => c.slug === slug && c.active);
        return cond ? (cond.value || 1) : 0;
    };

    // Penalidades de Status Globais (Não empilham, pega a pior)
    // Ex: Se tens Assustado 2 e Doente 1, a penalidade global é -2.
    const frightened = getCondVal("frightened");
    const sickened = getCondVal("sickened");
    const globalStatusPenalty = Math.max(frightened, sickened) * -1; // Valor negativo

    // Penalidades de Atributo (Status)
    const clumsy = getCondVal("clumsy") * -1;     // Dex
    const enfeebled = getCondVal("enfeebled") * -1; // Str
    const stupefied = getCondVal("stupefied") * -1; // Mentais

    // Modificadores de Circunstância na AC
    const isFlatFooted = getCondVal("flat_footed") > 0 || getCondVal("prone") > 0;
    const shieldBonus = getCondVal("raised_shield") > 0 ? 2 : 0; // Assumindo escudo padrão +2
    
    // Penalidade de Ataque por estar Caído
    const proneAttackPenalty = getCondVal("prone") > 0 ? -2 : 0;


    // 1. Atributos e Modificadores
    const getMod = (score: number) => Math.floor((score - 10) / 2);
    const abs = data.abilities || {};
    
    // Aplicamos penalidades de atributo AQUI (afeta tudo que deriva deles)
    // Nota: No PF2e, Clumsy não reduz o valor do atributo, reduz os TESTES baseados nele.
    // Mas para simplificar a automação visual, podemos ajustar o mod ou aplicar nos derivados.
    // Vamos aplicar nos derivados para ser mais fiel à regra (Attributes Check).
    
    const rawMods = {
      str: getMod(abs.str?.value || 10),
      dex: getMod(abs.dex?.value || 10),
      con: getMod(abs.con?.value || 10),
      int: getMod(abs.int?.value || 10),
      wis: getMod(abs.wis?.value || 10),
      cha: getMod(abs.cha?.value || 10),
    };

    // Mods Efetivos para Testes (Check Modifiers)
    const mods = {
        str: rawMods.str + globalStatusPenalty + enfeebled,
        dex: rawMods.dex + globalStatusPenalty + clumsy,
        con: rawMods.con + globalStatusPenalty,
        int: rawMods.int + globalStatusPenalty + stupefied,
        wis: rawMods.wis + globalStatusPenalty + stupefied,
        cha: rawMods.cha + globalStatusPenalty + stupefied,
    };

    const level = data.level || 1;

    // Helper de Cálculo Genérico
    const calcBonus = (rank: string, effectiveMod: number, item = 0, misc = 0) => {
      const profBonus = (!rank || rank === "U") ? 0 : getRankBonus(rank) + level;
      return effectiveMod + profBonus + (Number(item) || 0) + (Number(misc) || 0);
    };

    // 2. Defesas (AC)
    // AC é afetada por Clumsy (Status), Frightened (Status) e Flat-footed (Circ).
    // Nota: Clumsy e Frightened são ambos Status, não empilham. Pegamos o pior.
    const acStatusPenalty = Math.min(globalStatusPenalty, clumsy); // Ambos são negativos, min pega o menor (ex: -2 vs -1 = -2)
    
    const dexCap = data.ac?.cap ?? 99;
    const dexForAC = Math.min(rawMods.dex, dexCap); // Dex base, não a penalizada (penalidade entra como status)
    
    const acRank = data.ac?.rank || "U";
    const acProf = acRank === "U" ? 0 : getRankBonus(acRank) + level;
    
    // Cálculo Final da AC
    const acItem = (Number(data.ac?.item) || 0) + (Number(data.ac?.shield) || 0); // Shield passivo (runa)
    const acCircumstance = (isFlatFooted ? -2 : 0) + shieldBonus; // Flat-footed (-2) + Shield Raised (+2) se anulam
    
    const acTotal = 10 + dexForAC + acProf + acItem + acStatusPenalty + acCircumstance + (Number(data.ac?.misc) || 0);


    // 3. Saves
    // Fort: Con (Status: Global)
    // Ref: Dex (Status: Global vs Clumsy - pega pior)
    // Will: Wis (Status: Global vs Stupefied - pega pior)
    const refStatusPen = Math.min(globalStatusPenalty, clumsy);
    const willStatusPen = Math.min(globalStatusPenalty, stupefied);

    const saves = {
      fortitude: calcBonus(data.saves?.fortitude?.rank || "U", rawMods.con, data.saves?.fortitude?.item, data.saves?.fortitude?.misc) + globalStatusPenalty,
      reflex: calcBonus(data.saves?.reflex?.rank || "U", rawMods.dex, data.saves?.reflex?.item, data.saves?.reflex?.misc) + refStatusPen,
      will: calcBonus(data.saves?.will?.rank || "U", rawMods.wis, data.saves?.will?.item, data.saves?.will?.misc) + willStatusPen,
    };

    // 4. Percepção e Class DC
    const perception = calcBonus(data.perception?.rank || "U", rawMods.wis, data.perception?.item, data.perception?.misc) + Math.min(globalStatusPenalty, stupefied);
    
    const keyAttrStr = data.attributes?.class_dc?.key_attr || "str";
    const keyAttrMod = mods[keyAttrStr] || 0; // Já inclui penalidades
    const classDC = 10 + calcBonus(data.attributes?.class_dc?.rank || "U", keyAttrMod, data.attributes?.class_dc?.item, data.attributes?.class_dc?.misc); // Mod já está penalizado

    // 5. Perícias
    const skills: Record<string, number> = {};
    const skillList = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"];
    
    skillList.forEach(key => {
        // mods já contêm as penalidades apropriadas (Enfeebled, Clumsy, etc)
        let effectiveMod = mods.int;
        if (["athletics"].includes(key)) effectiveMod = mods.str;
        if (["acrobatics", "stealth", "thievery"].includes(key)) effectiveMod = mods.dex;
        if (["deception", "diplomacy", "intimidation", "performance"].includes(key)) effectiveMod = mods.cha;
        if (["medicine", "nature", "religion", "survival"].includes(key)) effectiveMod = mods.wis;

        const s = (data.skills as any)?.[key];
        const itemBonus = s ? (Number(s.item) || 0) - (Number(s.armor) || 0) : 0;
        
        if (s) {
            // Recalculamos manualmente para ter controle total
            const prof = (!s.rank || s.rank === "U") ? 0 : getRankBonus(s.rank) + level;
            skills[key] = effectiveMod + prof + itemBonus + (Number(s.misc) || 0);
        } else {
            skills[key] = effectiveMod;
        }
    });

    const lores = (data.lores || []).map(lore => ({
        ...lore,
        total: calcBonus(lore.rank, mods.int, lore.item, lore.misc)
    }));

    // 6. Carga (Bulk) - Enfeebled não reduz carga diretamente, mas reduz Str, logo reduz limites.
    const totalBulk = (data.inventory || []).reduce((acc: number, item: any) => {
        const q = Number(item.quantity) || 0;
        const bStr = String(item.bulk || "0").toUpperCase();
        const b = bStr === "L" ? 0.1 : (parseFloat(bStr) || 0);
        return acc + (b * q);
    }, 0);

    // Limites afetados por Enfeebled? 
    // Regra: Enfeebled dá penalidade em TESTES de Str, não no valor. 
    // Porém, muitos GMs aplicam no valor efetivo. Vamos manter regra RAW: não afeta carga.
    const encumberedLimit = 5 + rawMods.str; 
    const maxBulkLimit = 10 + rawMods.str;

    // 7. Ataque Mágico e Físico
    // Spell Attack sofre com Stupefied (se for magia) ou Global Frightened
    const spellKey = data.spellcasting?.key_attribute || "intelligence";
    const attrMap: Record<string, string> = { intelligence: "int", wisdom: "wis", charisma: "cha" };
    const shortKey = attrMap[spellKey] || "int";
    
    // Se a chave for mental, aplica Stupefied. Se não, só Global.
    const isMentalKey = ["int", "wis", "cha"].includes(shortKey);
    const spellStatusPen = Math.min(globalStatusPenalty, isMentalKey ? stupefied : 0);
    
    const spellModRaw = rawMods[shortKey as keyof typeof rawMods] || 0;
    const spellProfRank = data.spellcasting?.proficiency || "U";
    const spellProfBonus = spellProfRank === "U" ? 0 : getRankBonus(spellProfRank) + level;
    
    const spellAttack = spellModRaw + spellProfBonus + (Number(data.spellcasting?.attack) || 0) + spellStatusPen;
    const spellDC = 10 + spellAttack + (Number(data.spellcasting?.dc) || 0); // DC também sofre penalidade

    return { 
        mods, // Estes mods já estão penalizados! A UI vai mostrar o valor vermelho automaticamente.
        rawMods, // Mods puros para referência se necessário
        level, 
        acTotal, 
        saves, 
        perception, 
        skills, 
        lores, 
        classDC,
        bulk: { total: totalBulk, encumbered: encumberedLimit, max: maxBulkLimit },
        magic: { attack: spellAttack, dc: spellDC },
        // Exportamos penalidades extras para a UI de Combate usar (ex: Prone penalty no ataque)
        combatPenalties: {
            prone: proneAttackPenalty,
            enfeebled: enfeebled // Deve ser somado ao ataque físico
        }
    };
  }, [data]);
};