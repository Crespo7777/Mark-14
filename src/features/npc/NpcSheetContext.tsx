// src/features/npc/NpcSheetContext.tsx

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  CharacterSheetData,
  characterSheetSchema,
} from "@/features/character/character.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";
// 1. Importar o Contexto do Personagem e seu Tipo
import {
  CharacterSheetContext,
  CharacterSheetContextType,
} from "@/features/character/CharacterSheetContext";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetContextType {
  npc: Npc;
  form: UseFormReturn<CharacterSheetData>;
  // isEditing: boolean; // Removido
  // setIsEditing: (isEditing: boolean) => void; // Removido
}

const NpcSheetContext = createContext<NpcSheetContextType | null>(null);

interface NpcSheetProviderProps {
  children: ReactNode;
  npc: Npc;
  // isEditing: boolean; // Removido
  // setIsEditing: (isEditing: boolean) => void; // Removido
}

export const NpcSheetProvider = ({
  children,
  npc,
}: // isEditing, // Removido
// setIsEditing, // Removido
NpcSheetProviderProps) => {
  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: npc.data as CharacterSheetData,
  });

  // 2. Criar o valor para o Contexto de NPC
  const npcContextValue: NpcSheetContextType = {
    npc,
    form,
    // isEditing, // Removido
    // setIsEditing, // Removido
  };

  // 3. Criar um valor "falso" para o Contexto de Personagem
  // As abas (DetailsTab, etc.) usam o hook 'useCharacterSheet'
  // Passamos o 'npc' no campo 'character' (com 'as any')
  const characterContextValue: CharacterSheetContextType = {
    character: npc as any, // "Engana" o contexto
    form,
    // isEditing, // Removido
    // setIsEditing, // Removido
  };

  return (
    // 4. Fornecer AMBOS os contextos
    <NpcSheetContext.Provider value={npcContextValue}>
      <CharacterSheetContext.Provider value={characterContextValue}>
        {children}
      </CharacterSheetContext.Provider>
    </NpcSheetContext.Provider>
  );
};

export const useNpcSheet = () => {
  const context = useContext(NpcSheetContext);
  if (!context) {
    throw new Error("useNpcSheet deve ser usado dentro de um NpcSheetProvider");
  }
  return context;
};