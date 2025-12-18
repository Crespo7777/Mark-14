import { CharacterSheetData } from "../utils/symbaroum.schema";
import { ATTRIBUTES } from "../utils/symbaroum.constants";

export interface DerivedStats {
    strong: number;
    quick: number;
    resolute: number;
    vigilant: number;
    persuasive: number;
    cunning: number;
    discreet: number;
    precise: number;
    
    toughnessMax: number;
    painThreshold: number;
    defense: number;
    totalDefense: number;
    armorImpeding: number;
    
    corruptionThreshold: number;
    totalCorruption: number;
    
    totalWeight: number;
    maxLoad: number;
    encumbranceStatus: "Light" | "Heavy" | "Overloaded";
    
    currentExperience: number;
    remainingAttributePoints: number; // <--- NOVO CAMPO
    
    activeBerserk: boolean;
    featOfStrength: boolean;
    isBloodied: boolean;
    
    modifiers: Record<string, number>;
}

export const calculateSymbaroumStats = (data: CharacterSheetData): DerivedStats => {
    const getAttr = (key: string) => {
        if (!data.attributes) return 10;
        const val = (data.attributes as any)[key];
        return typeof val === 'object' ? (Number(val?.value) || 10) : (Number(val) || 10);
    };

    const strong = getAttr("strong");
    const quick = getAttr("quick");
    const resolute = getAttr("resolute");
    const vigilant = getAttr("vigilant");
    const persuasive = getAttr("persuasive");
    const cunning = getAttr("cunning");
    const discreet = getAttr("discreet");
    const precise = getAttr("precise");

    // Cálculo de Pontos Restantes (80 - soma)
    const totalAttributes = strong + quick + resolute + vigilant + persuasive + cunning + discreet + precise;
    const remainingAttributePoints = 80 - totalAttributes;

    const toughnessMax = Math.max(10, strong); 
    const painThreshold = Math.ceil(strong / 2);
    const corruptionThreshold = Math.ceil(resolute / 2);
    
    const defenseBase = quick;
    const armorImpeding = parseInt((data.combat?.armor as any)?.obstructive || "0") || 0;
    const totalDefense = defenseBase - armorImpeding;

    // Lógica básica de carga (simplificada para o exemplo)
    const items = [...(data.inventory || []), ...(data.combat?.weapons || []), ...(data.combat?.armors || [])];
    const totalWeight = items.reduce((acc, item: any) => acc + (parseInt(item.weight) || 0), 0);
    const maxLoad = strong * 2; 
    let encumbranceStatus: "Light" | "Heavy" | "Overloaded" = "Light";
    if (totalWeight > maxLoad) encumbranceStatus = "Overloaded";

    const currentExperience = (data.experience?.total || 0) - (data.experience?.spent || 0);
    const totalCorruption = (data.corruption?.temporary || 0) + (data.corruption?.permanent || 0);
    const currentHp = data.toughness?.current ?? toughnessMax;
    const isBloodied = currentHp <= toughnessMax / 2;

    const modifiers: Record<string, number> = {};
    ATTRIBUTES.forEach(attr => {
        modifiers[attr.key] = getAttr(attr.key) - 10;
    });

    return {
        strong, quick, resolute, vigilant, persuasive, cunning, discreet, precise,
        toughnessMax,
        painThreshold,
        defense: defenseBase,
        totalDefense,
        armorImpeding,
        corruptionThreshold,
        totalCorruption,
        totalWeight,
        maxLoad,
        encumbranceStatus,
        currentExperience,
        remainingAttributePoints, // <--- RETORNADO AQUI
        activeBerserk: false, 
        featOfStrength: false, 
        isBloodied,
        modifiers
    };
};