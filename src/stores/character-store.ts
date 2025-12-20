import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
// CORREÇÃO: Caminho atualizado para 'symbaroum.schema'
import { CharacterSheetData, defaultCharacterData } from '@/features/systems/symbaroum/utils/symbaroum.schema';
import { calculateCharacterStats, CharacterDerivedStats } from '@/features/character/logic/character-calculations';
import { setAutoFreeze } from 'immer';

// --- CORREÇÃO CRÍTICA ---
// Desativa o congelamento automático do Immer para compatibilidade com react-hook-form
setAutoFreeze(false);

interface CharacterState {
  // Estado
  characterId: string | null;
  data: CharacterSheetData;
  derived: CharacterDerivedStats;
  
  // Meta-Estado
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Actions
  initialize: (id: string, data: CharacterSheetData) => void;
  updateData: (updater: (draft: CharacterSheetData) => void) => void;
  setSaving: (saving: boolean) => void;
  markDirty: (dirty: boolean) => void;
}

// Estado Inicial Derivado
const initialDerived: CharacterDerivedStats = {
  strong: 0, quick: 0, resolute: 0, vigilant: 0, persuasive: 0, cunning: 0, discreet: 0, precise: 0,
  painThreshold: 0, defense: 0, totalDefense: 0, armorImpeding: 0,
  totalWeight: 0, maxLoad: 0, encumbranceStatus: 'Light',
  currentExperience: 0, corruptionThreshold: 0, totalCorruption: 0,
  toughnessMax: 10, activeBerserk: undefined, featOfStrength: undefined, isBloodied: false
};

export const useCharacterStore = create<CharacterState>()(
  subscribeWithSelector(
    immer((set) => ({
      characterId: null,
      data: defaultCharacterData,
      derived: initialDerived,
      isDirty: false,
      isSaving: false,
      lastSaved: null,

      initialize: (id, data) => {
        const stats = calculateCharacterStats(data);
        set({ 
          characterId: id, 
          data, 
          derived: stats, 
          isDirty: false, 
          isSaving: false 
        });
      },

      updateData: (updater) => {
        set((state) => {
          updater(state.data);
          // Recalcula stats automaticamente
          state.derived = calculateCharacterStats(state.data);
          state.isDirty = true;
        });
      },

      setSaving: (saving) => set({ isSaving: saving }),
      markDirty: (dirty) => set({ isDirty: dirty }),
    }))
  )
);