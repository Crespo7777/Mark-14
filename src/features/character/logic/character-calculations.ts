import { CharacterSheetData } from "../../systems/symbaroum/utils/character.schema";
// Importamos o calculador ESPECÍFICO do Symbaroum
import { calculateSymbaroumStats, DerivedStats } from "@/features/systems/symbaroum/logic/symbaroum-calculator";

// Re-exportamos o tipo para a Store Global usar
export type CharacterDerivedStats = DerivedStats;

// Função Default para sistemas vazios (como Pathfinder atualmente)
// Isso impede o app de quebrar enquanto reconstruímos o PF
const defaultEmptyStats: DerivedStats = {
    strong: 0, quick: 0, resolute: 0, vigilant: 0,
    persuasive: 0, cunning: 0, discreet: 0, precise: 0,
    painThreshold: 0, defense: 10, totalDefense: 10, armorImpeding: 0,
    totalWeight: 0, maxLoad: 100, encumbranceStatus: "Light",
    currentExperience: 0, corruptionThreshold: 0, totalCorruption: 0,
    toughnessMax: 10, activeBerserk: false, featOfStrength: false, isBloodied: false
};

// O ROTEADOR CENTRAL
// Ele não sabe matemática. Ele só sabe delegar.
export const calculateCharacterStats = (data: CharacterSheetData): CharacterDerivedStats => {
    
    // 1. Detecção de Sistema
    // (Pode ser melhorada no futuro lendo system_type direto da tabela, 
    // mas por enquanto usamos a estrutura de dados como 'flag')
    const isPathfinder = !!(data as any).abilities || ('str' in ((data as any).abilities || {}));
    
    // 2. Roteamento
    if (isPathfinder) {
        // Como o Pathfinder foi limpo, retornamos o default para não travar
        // Futuramente: return calculatePathfinderStats(data);
        return defaultEmptyStats;
    } 
    
    // Padrão: Symbaroum (Delega para a pasta do sistema)
    return calculateSymbaroumStats(data);
};