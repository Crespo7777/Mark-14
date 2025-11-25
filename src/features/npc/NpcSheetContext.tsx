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
  
  // Refs para evitar 'stale state'
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // --- VERIFICAÇÃO DE MESTRE ---
  const { isMaster } = useTableContext();
  
  // Se for Mestre, NÃO é ReadOnly. Se for Jogador, É ReadOnly.
  const isReadOnly = !isMaster;

  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: npc.data as NpcSheetData,
  });

  const { isDirty } = form.formState;

  // --- CORREÇÃO CRÍTICA: Reset Inteligente ---
  const handleSaveSuccess = useCallback((data: NpcSheetData) => {
    // keepValues: true -> Mantém o que o utilizador escreveu no input
    // keepDirty: false -> Marca como "limpo" (salvo) para o RHF
    form.reset(data, { 
      keepValues: true, 
      keepDirty: false,
      keepErrors: true,
      keepTouched: true 
    }); 
    
    // Toast removido para não spamar no auto-save (opcional)
    // toast({ title: "Ficha de NPC Salva!" });
    setIsSaving(false);
  }, [form]); // Sem dependência de 'toast' para evitar re-criação

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
    if (isReadOnly) return; // Jogadores não salvam NPCs
    setIsSaving(true);
    try {
      // Obtém os dados ATUAIS do formulário (incluindo o que acabou de ser digitado)
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  }, [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError]);
  
  const programmaticSaveRef = useRef(programmaticSave);
  useEffect(() => {
    programmaticSaveRef.current = programmaticSave;
  }, [programmaticSave]);

  // Save Manual
  const saveSheet = useCallback(
    () => form.handleSubmit(async (data) => {
      if (isSavingRef.current || isReadOnly) return;
      setIsSaving(true);
      try {
        await onSave(data);
        handleSaveSuccess(data);
        toast({ title: "Ficha Salva!" }); // Toast apenas no manual
      } catch (error) {
        handleSaveError(error);
      }
    }, handleSaveInvalid)(),
    [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError, handleSaveInvalid, toast]
  );

  // Auto-Save
  useEffect(() => {
    if (isReadOnly) return;

    const subscription = form.watch((value, { name, type }) => {
      // Apenas acionar se for uma mudança de utilizador (ex: 'onChange')
      if (!type) return; 
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (form.formState.isDirty && !isSavingRef.current) {
          console.log("Auto-saving NPC sheet...");
          programmaticSaveRef.current(); 
        }
      }, 3000); // 3 segundos para ser menos agressivo
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
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