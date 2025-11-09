// src/features/npc/NpcSheetContext.tsx

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";

// --- NOVOS IMPORTS ---
// 1. Importar o NOVO schema do NPC
import {
  NpcSheetData,
  npcSheetSchema,
} from "@/features/npc/npc.schema"; 
// --- FIM DOS NOVOS IMPORTS ---

// --- REMOVIDO ---
// import { CharacterSheetContext, CharacterSheetContextType } from "@/features/character/CharacterSheetContext";
// --- FIM DO REMOVIDO ---

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

// 2. Definir o NOVO tipo de Contexto
interface NpcSheetContextType {
  npc: Npc;
  form: UseFormReturn<NpcSheetData>; // Usa o NpcSheetData
}

// 3. Criar o NOVO Contexto
const NpcSheetContext = createContext<NpcSheetContextType | null>(null);

interface NpcSheetProviderProps {
  children: ReactNode;
  npc: Npc;
  // Props de isEditing removidas (seguindo o padrão da Ficha de Personagem)
}

export const NpcSheetProvider = ({
  children,
  npc,
}: NpcSheetProviderProps) => {
  
  // 4. Usar o React Hook Form com o NOVO schema
  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: npc.data as NpcSheetData,
  });

  // 5. Definir o valor do contexto
  const npcContextValue: NpcSheetContextType = {
    npc,
    form,
  };

  return (
    // 6. Prover APENAS o NpcSheetContext.
    // Aquele "truque" de prover o CharacterSheetContext foi removido.
    <NpcSheetContext.Provider value={npcContextValue}>
      {children}
    </NpcSheetContext.Provider>
  );
};

// 7. Hook atualizado para consumir o novo contexto
export const useNpcSheet = () => {
  const context = useContext(NpcSheetContext);
  if (!context) {
    throw new Error("useNpcSheet deve ser usado dentro de um NpcSheetProvider");
  }
  return context;
};