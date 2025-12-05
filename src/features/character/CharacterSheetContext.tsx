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
import { CharacterSheetData, characterSheetSchema } from "./character.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Character = Database["public"]["Tables"]["characters"]["Row"];

export interface CharacterSheetContextType {
  character: Character;
  form: UseFormReturn<CharacterSheetData>;
  isDirty: boolean; 
  isSaving: boolean; 
  saveSheet: (options?: { silent?: boolean }) => Promise<void>; 
}

export const CharacterSheetContext =
  createContext<CharacterSheetContextType | null>(null);

interface CharacterSheetProviderProps {
  children: ReactNode;
  character: Character;
  onSave: (data: CharacterSheetData) => Promise<void>;
}

export const CharacterSheetProvider = ({
  children,
  character,
  onSave,
}: CharacterSheetProviderProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: character.data as CharacterSheetData,
  });

  const { isDirty } = form.formState;

  // Lógica de Reset após salvar (mantém o cursor e valores)
  const handleSaveSuccess = useCallback((data: CharacterSheetData) => {
    form.reset(data, { 
      keepValues: true, 
      keepDirty: false,
      keepErrors: true,
      keepTouched: true
    }); 
    setIsSaving(false);
  }, [form]); 

  const handleSaveError = useCallback((error: any) => {
    console.error("Erro ao salvar:", error);
    toast({
      title: "Erro ao Salvar",
      description: "Não foi possível sincronizar a ficha.",
      variant: "destructive",
    });
    setIsSaving(false);
  }, [toast]);

  // FUNÇÃO UNIFICADA DE SALVAR
  const saveSheet = useCallback(
    async (options?: { silent?: boolean }) => {
      if (isSavingRef.current) return;
      
      const data = form.getValues(); // Pega os dados atuais
      setIsSaving(true);
      
      try {
        await onSave(data); // Salva no Supabase
        handleSaveSuccess(data); // Reseta estado "dirty"
        
        // Só mostra aviso se NÃO for silencioso
        if (!options?.silent) {
            toast({ title: "Ficha Salva!" });
        }
      } catch (error) {
        handleSaveError(error);
      }
    },
    [form, onSave, handleSaveSuccess, handleSaveError, toast]
  );
  
  const saveSheetRef = useRef(saveSheet);
  useEffect(() => {
    saveSheetRef.current = saveSheet;
  }, [saveSheet]);

  // AUTO-SAVE INTERNO (Silencioso)
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Ignora eventos que não sejam mudanças reais se possível, mas o watch dispara em tudo
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        if (form.formState.isDirty && !isSavingRef.current) {
          console.log("Auto-saving (Silent)...");
          saveSheetRef.current({ silent: true }); // <--- SALVA SILENCIOSAMENTE
        }
      }, 3000); // 3 segundos de espera
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form]); 

  return (
    <CharacterSheetContext.Provider
      value={{
        character,
        form,
        isDirty,
        isSaving,
        saveSheet,
      }}
    >
      {children}
    </CharacterSheetContext.Provider>
  );
};

export const useCharacterSheet = () => {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error("useCharacterSheet deve ser usado dentro de um CharacterSheetProvider");
  }
  return context;
};