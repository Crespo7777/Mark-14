// src/features/character/CharacterSheetContext.tsx

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { CharacterSheetData, characterSheetSchema } from "./character.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

// 1. ATUALIZAR O TIPO (remover isEditing)
export interface CharacterSheetContextType {
  character: Character;
  form: UseFormReturn<CharacterSheetData>;
  // isEditing: boolean; // Removido
  // setIsEditing: (isEditing: boolean) => void; // Removido
}

// 2. ATUALIZAR O CONTEXTO
export const CharacterSheetContext =
  createContext<CharacterSheetContextType | null>(null);

interface CharacterSheetProviderProps {
  children: ReactNode;
  character: Character;
  onSave: (data: CharacterSheetData) => Promise<void>;
  // isEditing: boolean; // Removido
  // setIsEditing: (isEditing: boolean) => void; // Removido
}

export const CharacterSheetProvider = ({
  children,
  character,
  onSave, // onSave ainda é necessário para o CharacterSheetInner
}: // ...isEditing e setIsEditing removidos das props
CharacterSheetProviderProps) => {
  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: character.data as CharacterSheetData,
  });

  return (
    <CharacterSheetContext.Provider
      value={{
        character,
        form,
        // isEditing, // Removido
        // setIsEditing, // Removido
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