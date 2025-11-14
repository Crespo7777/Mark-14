// src/features/npc/NpcSheetContext.tsx

import { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";
import {
  NpcSheetData,
  npcSheetSchema,
} from "@/features/npc/npc.schema";
// --- 1. IMPORTAR useTableContext ---
import { useTableContext } from "@/features/table/TableContext";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetContextType {
  npc: Npc;
  form: UseFormReturn<NpcSheetData>;
  isReadOnly: boolean; // <-- 2. ADICIONAR PROPRIEDADE
}

const NpcSheetContext = createContext<NpcSheetContextType | null>(null);

interface NpcSheetProviderProps {
  children: ReactNode;
  npc: Npc;
}

export const NpcSheetProvider = ({
  children,
  npc,
}: NpcSheetProviderProps) => {
  
  // --- 3. OBTER 'isMaster' DO CONTEXTO DA MESA ---
  const { isMaster } = useTableContext();
  const isReadOnly = !isMaster;
  // --- FIM DA ADIÇÃO ---

  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: npc.data as NpcSheetData,
  });

  const npcContextValue: NpcSheetContextType = {
    npc,
    form,
    isReadOnly, // <-- 4. PASSAR PARA O CONTEXTO
  };

  return (
    <NpcSheetContext.Provider value={npcContextValue}>
      {children}
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