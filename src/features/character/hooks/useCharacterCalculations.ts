import { useCharacterStore } from "@/stores/character-store";
import { useShallow } from 'zustand/react/shallow';

export const useCharacterCalculations = () => {
  // useShallow impede re-renderizações se o objeto derived não mudar profundamente
  const derived = useCharacterStore(useShallow(state => state.derived));
  return derived;
};