// src/features/character/CharacterSheetContext.tsx

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { CharacterSheetData, characterSheetSchema } from "./character.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

// 1. EXPORTE O TIPO
export interface CharacterSheetContextType {
  character: Character;
  form: UseFormReturn<CharacterSheetData>;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

// 2. EXPORTE O CONTEXTO
export const CharacterSheetContext =
  createContext<CharacterSheetContextType | null>(null);

interface CharacterSheetProviderProps {
  children: ReactNode;
  character: Character;
  onSave: (data: CharacterSheetData) => Promise<void>;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export const CharacterSheetProvider = ({
  children,
  character,
  onSave,
  isEditing,
  setIsEditing,
}: CharacterSheetProviderProps) => {
  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: character.data as CharacterSheetData,
  });

  return (
    <CharacterSheetContext.Provider
      value={{
        character,
        form,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </CharacterSheetContext.Provider>
  );
};

export const useCharacterSheet = () => {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error(
      "useCharacterSheet deve ser usado dentro de um CharacterSheetProvider",
    );
  }
  return context;
};