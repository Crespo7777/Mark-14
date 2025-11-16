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

  // --- 1. Refs para evitar 'stale state' no callback do watch ---
  // O Ref guarda o valor ATUAL do 'isSaving'
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: character.data as CharacterSheetData,
  });

  const { isDirty } = form.formState;

  // --- 2. Callbacks de salvamento (sem dependência de 'isSaving') ---
  const handleSaveSuccess = useCallback((data: CharacterSheetData) => {
    form.reset(data); // "Limpa" o formulário (isDirty = false)
    toast({ title: "Ficha Salva!" });
    setIsSaving(false);
  }, [form, toast]);

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

  // Save Programático (Auto-save ou diálogos)
  const programmaticSave = useCallback(async () => {
    // Não verifica 'isSaving' aqui, o 'caller' (timer) é que verifica
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  }, [form, onSave, handleSaveSuccess, handleSaveError]);
  
  // Ref para a função (para o timer ter sempre a função mais recente)
  const programmaticSaveRef = useRef(programmaticSave);
  useEffect(() => {
    programmaticSaveRef.current = programmaticSave;
  }, [programmaticSave]);

  // Save Manual (Botão "Salvar")
  const saveSheet = useCallback(
    () => form.handleSubmit(async (data) => {
      // Usa o Ref para a verificação
      if (isSavingRef.current) return; 
      setIsSaving(true);
      try {
        await onSave(data);
        handleSaveSuccess(data);
      } catch (error) {
        handleSaveError(error);
      }
    }, handleSaveInvalid)(),
    [form, onSave, handleSaveSuccess, handleSaveError, handleSaveInvalid]
  );
  
  // --- 3. Efeito de Auto-Save (Corrigido) ---
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Apenas acionar se for uma mudança de utilizador (ex: 'onChange')
      if (!type) return;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        // Usa os Refs para aceder aos valores ATUAIS
        if (form.formState.isDirty && !isSavingRef.current) {
          console.log("Auto-saving character sheet...");
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
  }, [form]); 


  return (
    <CharacterSheetContext.Provider
      value={{
        character,
        form,
        isDirty,
        isSaving,
        saveSheet,
        programmaticSave, // Mantemos este aqui para o 'WeaponAttackDialog', etc.
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