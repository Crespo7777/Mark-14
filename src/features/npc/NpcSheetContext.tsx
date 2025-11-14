// src/features/npc/NpcSheetContext.tsx

import { createContext, useContext, ReactNode, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";
import { NpcSheetData, npcSheetSchema } from "@/features/npc/npc.schema";
import { useTableContext } from "@/features/table/TableContext";
import { useToast } from "@/hooks/use-toast";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

export interface NpcSheetContextType {
  npc: Npc;
  form: UseFormReturn<NpcSheetData>;
  isReadOnly: boolean; // <-- Mestre ou Jogador?
  isDirty: boolean; // <-- Há mudanças?
  isSaving: boolean; // <-- Está salvando?
  saveSheet: () => Promise<void>; // <-- Botão Salvar
  programmaticSave: () => Promise<void>; // <-- Salvar dialogs
}

const NpcSheetContext = createContext<NpcSheetContextType | null>(null);

interface NpcSheetProviderProps {
  children: ReactNode;
  npc: Npc;
  onSave: (data: NpcSheetData) => Promise<void>; // A função de salvar
}

export const NpcSheetProvider = ({
  children,
  npc,
  onSave,
}: NpcSheetProviderProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // 1. Determinar se a ficha é "somente leitura"
  const { isMaster } = useTableContext();
  const isReadOnly = !isMaster;

  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: npc.data as NpcSheetData,
  });

  const { isDirty } = form.formState;

  // Callbacks de salvamento
  const handleSaveSuccess = (data: NpcSheetData) => {
    form.reset(data); // Limpa o estado 'isDirty'
    toast({ title: "Ficha de NPC Salva!" });
    setIsSaving(false);
  };

  const handleSaveInvalid = (errors: any) => {
    console.error("Erros de validação (NPC):", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  const handleSaveError = (error: any) => {
    console.error("Falha no submit (NPC):", error);
    toast({
      title: "Erro ao Salvar",
      description: "Não foi possível salvar a ficha do NPC.",
      variant: "destructive",
    });
    setIsSaving(false);
  };

  // FUNÇÃO 1: Salvar com Validação (Botão "Salvar")
  const saveSheet = form.handleSubmit(async (data) => {
    if (isReadOnly) return; // Segurança
    setIsSaving(true);
    try {
      await onSave(data);
      handleSaveSuccess(data);
    } catch (error) {
      handleSaveError(error);
    }
  }, handleSaveInvalid);

  // FUNÇÃO 2: Salvar Programaticamente (Usado por rolagens de NPC, se necessário)
  const programmaticSave = async () => {
    if (isReadOnly) return; // Segurança
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  };

  const npcContextValue: NpcSheetContextType = {
    npc,
    form,
    isReadOnly,
    isDirty,
    isSaving,
    saveSheet,
    programmaticSave,
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