// src/features/character/CharacterSheetContext.tsx

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
  saveSheet: () => Promise<void>; 
  programmaticSave: () => Promise<void>; 
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

  // --- CORREÇÃO: Reset Inteligente ---
  const handleSaveSuccess = useCallback((data: CharacterSheetData) => {
    // keepValues: true -> Não apaga o que o utilizador escreveu
    form.reset(data, { 
      keepValues: true, 
      keepDirty: false,
      keepErrors: true,
      keepTouched: true
    }); 
    setIsSaving(false);
  }, [form]); 

  const handleSaveInvalid = useCallback((errors: any) => {
    console.error("Erros de validação:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
    setIsSaving(false); 
  }, [toast]);

  const handleSaveError = useCallback((error: any) => {
    console.error("Falha no submit:", error);
    toast({
      title: "Erro ao Salvar",
      description: "Não foi possível salvar a ficha.",
      variant: "destructive",
    });
    setIsSaving(false);
  }, [toast]);

  const programmaticSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  }, [form, onSave, handleSaveSuccess, handleSaveError]);
  
  const programmaticSaveRef = useRef(programmaticSave);
  useEffect(() => {
    programmaticSaveRef.current = programmaticSave;
  }, [programmaticSave]);

  const saveSheet = useCallback(
    () => form.handleSubmit(async (data) => {
      if (isSavingRef.current) return; 
      setIsSaving(true);
      try {
        await onSave(data);
        handleSaveSuccess(data);
        toast({ title: "Ficha Salva!" });
      } catch (error) {
        handleSaveError(error);
      }
    }, handleSaveInvalid)(),
    [form, onSave, handleSaveSuccess, handleSaveError, handleSaveInvalid, toast]
  );
  
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!type) return;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (form.formState.isDirty && !isSavingRef.current) {
          console.log("Auto-saving character sheet...");
          programmaticSaveRef.current(); 
        }
      }, 3000);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
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
        programmaticSave,
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