// src/features/npc/NpcSheetContext.tsx

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
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
  isReadOnly: boolean; 
  isDirty: boolean; 
  isSaving: boolean; 
  saveSheet: () => Promise<void>; 
  programmaticSave: () => Promise<void>; 
}

const NpcSheetContext = createContext<NpcSheetContextType | null>(null);

interface NpcSheetProviderProps {
  children: ReactNode;
  npc: Npc;
  onSave: (data: NpcSheetData) => Promise<void>;
}

export const NpcSheetProvider = ({
  children,
  npc,
  onSave,
}: NpcSheetProviderProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // --- 1. Refs para evitar 'stale state' ---
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const { isMaster } = useTableContext();
  const isReadOnly = !isMaster;

  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: npc.data as NpcSheetData,
  });

  const { isDirty } = form.formState;

  // --- 2. Callbacks de salvamento (sem dependência de 'isSaving') ---
  const handleSaveSuccess = useCallback((data: NpcSheetData) => {
    form.reset(data); 
    toast({ title: "Ficha de NPC Salva!" });
    setIsSaving(false);
  }, [form, toast]);

  const handleSaveInvalid = useCallback((errors: any) => {
    console.error("Erros de validação (NPC):", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
    setIsSaving(false);
  }, [toast]);

  const handleSaveError = useCallback((error: any) => {
    console.error("Falha no submit (NPC):", error);
    toast({
      title: "Erro ao Salvar",
      description: "Não foi possível salvar a ficha do NPC.",
      variant: "destructive",
    });
    setIsSaving(false);
  }, [toast]);

  // Save Programático (Auto-save)
  const programmaticSave = useCallback(async () => {
    if (isReadOnly) return; // Segurança (o 'isSaving' é verificado no timer)
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  }, [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError]);
  
  // Ref para a função
  const programmaticSaveRef = useRef(programmaticSave);
  useEffect(() => {
    programmaticSaveRef.current = programmaticSave;
  }, [programmaticSave]);

  // Save Manual (Botão "Salvar")
  const saveSheet = useCallback(
    () => form.handleSubmit(async (data) => {
      if (isSavingRef.current || isReadOnly) return; // Segurança
      setIsSaving(true);
      try {
        await onSave(data);
        handleSaveSuccess(data);
      } catch (error) {
        handleSaveError(error);
      }
    }, handleSaveInvalid)(),
    [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError, handleSaveInvalid]
  );

  // --- 3. Efeito de Auto-Save (Corrigido) ---
  useEffect(() => {
    if (isReadOnly) return; // Não fazer nada se for apenas leitura (jogador)

    const subscription = form.watch((value, { name, type }) => {
      if (!type) return; 
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        // Usa os Refs
        if (form.formState.isDirty && !isSavingRef.current) {
          console.log("Auto-saving NPC sheet...");
          programmaticSaveRef.current(); // Chama a função pelo ref
        }
      }, 2000); // 2 segundos
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  // --- 4. Dependência estável (só corre 1 vez) ---
  }, [form, isReadOnly]); 
  
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