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
// Ajuste de importação para o schema que movemos
import { NpcSheetData, npcSheetSchema } from "./npc.schema"; 
import { useTableContext } from "@/features/table/TableContext";
import { useToast } from "@/hooks/use-toast";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

export interface SymbaroumNpcContextType {
  npc: Npc;
  form: UseFormReturn<NpcSheetData>;
  isReadOnly: boolean; 
  isDirty: boolean; 
  isSaving: boolean; 
  saveSheet: () => Promise<void>; 
  programmaticSave: () => Promise<void>; 
}

const SymbaroumNpcContext = createContext<SymbaroumNpcContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
  npc: Npc;
  onSave: (data: NpcSheetData) => Promise<void>;
}

export const SymbaroumNpcSheetProvider = ({ children, npc, onSave }: ProviderProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const isSavingRef = useRef(isSaving);
  useEffect(() => { isSavingRef.current = isSaving; }, [isSaving]);

  const { isMaster } = useTableContext();
  const isReadOnly = !isMaster;

  const getInitialValues = (npcRow: Npc): NpcSheetData => {
    const rawData = npcRow.data as any || {};
    return {
        ...rawData,
        name: npcRow.name,
        image_url: npcRow.image_url,
    };
  };

  const form = useForm<NpcSheetData>({
    resolver: zodResolver(npcSheetSchema),
    defaultValues: getInitialValues(npc),
  });

  const { isDirty } = form.formState;

  useEffect(() => {
      if (npc) {
        const currentValues = form.getValues();
        if (npc.id !== (currentValues as any).id && !isDirty) {
            form.reset(getInitialValues(npc));
        }
      }
  }, [npc, form, isDirty]);

  const handleSaveSuccess = useCallback((data: NpcSheetData) => {
    form.reset(data, { keepValues: true, keepDirty: false, keepErrors: true, keepTouched: true }); 
    setIsSaving(false);
  }, [form]);

  const handleSaveInvalid = useCallback((errors: any) => {
    console.error("NPC Validation Error:", errors);
    toast({ title: "Erro de Validação", description: "Verifique os campos.", variant: "destructive" });
    setIsSaving(false);
  }, [toast]);

  const handleSaveError = useCallback((error: any) => {
    console.error("NPC Save Error:", error);
    toast({ title: "Erro ao Salvar", description: "Falha ao salvar NPC.", variant: "destructive" });
    setIsSaving(false);
  }, [toast]);

  const programmaticSave = useCallback(async () => {
    if (isReadOnly) return;
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  }, [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError]);
  
  const programmaticSaveRef = useRef(programmaticSave);
  useEffect(() => { programmaticSaveRef.current = programmaticSave; }, [programmaticSave]);

  const saveSheet = useCallback(
    () => form.handleSubmit(async (data) => {
      if (isSavingRef.current || isReadOnly) return;
      setIsSaving(true);
      try {
        await onSave(data);
        handleSaveSuccess(data);
        toast({ title: "NPC Salvo!" });
      } catch (error) {
        handleSaveError(error);
      }
    }, handleSaveInvalid)(),
    [isReadOnly, form, onSave, handleSaveSuccess, handleSaveError, handleSaveInvalid, toast]
  );

  useEffect(() => {
    if (isReadOnly) return;
    const subscription = form.watch((value, { type }) => {
      if (!type) return; 
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (form.formState.isDirty && !isSavingRef.current) {
          programmaticSaveRef.current(); 
        }
      }, 3000);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form, isReadOnly]); 
  
  return (
    <SymbaroumNpcContext.Provider value={{ npc, form, isReadOnly, isDirty, isSaving, saveSheet, programmaticSave }}>
      {children}
    </SymbaroumNpcContext.Provider>
  );
};

export const useSymbaroumNpcSheet = () => {
  const context = useContext(SymbaroumNpcContext);
  if (!context) throw new Error("useSymbaroumNpcSheet must be used within SymbaroumNpcSheetProvider");
  return context;
};