import { createContext, useContext } from "react";
import { UseFormReturn } from "react-hook-form";

// Interface Genérica <T> para aceitar qualquer sistema (Symbaroum, D&D, etc.)
export interface CharacterSheetContextType<T = any> {
  // O formulário React Hook Form
  form: UseFormReturn<T>;
  
  // Dados Meta
  characterId: string;
  isReadOnly: boolean;
  activeTab: string;
  
  // Dados do Personagem
  character: any; 
  
  // Estado de Salvamento
  isSaving: boolean;
  
  // Função para salvar (pode ser manual ou silenciosa)
  saveSheet: (options?: { silent?: boolean }) => Promise<void>;
}

// Criação do Contexto
export const CharacterSheetContext = createContext<CharacterSheetContextType | null>(null);

// Hook para consumir o contexto
export const useCharacterSheet = () => {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error("useCharacterSheet deve ser usado dentro de um CharacterSheetContext.Provider");
  }
  return context;
};