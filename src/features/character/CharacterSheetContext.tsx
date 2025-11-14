// src/features/character/CharacterSheetContext.tsx

import { createContext, useContext, ReactNode, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { CharacterSheetData, characterSheetSchema } from "./character.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Character = Database["public"]["Tables"]["characters"]["Row"];

// 1. ATUALIZAMOS A INTERFACE DO CONTEXTO
export interface CharacterSheetContextType {
  character: Character;
  form: UseFormReturn<CharacterSheetData>;
  isDirty: boolean; // <-- Gerenciado pelo react-hook-form
  isSaving: boolean; // <-- Nosso estado de "salvando..."
  saveSheet: () => Promise<void>; // <-- Para o botão "Salvar" (valida o form)
  programmaticSave: () => Promise<void>; // <-- Para salvar em diálogos (não valida)
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
  onSave, // Recebemos a função que realmente fala com o Supabase
}: CharacterSheetProviderProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<CharacterSheetData>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: character.data as CharacterSheetData,
  });

  // 2. Extrair o 'isDirty' (sabe se há mudanças)
  const { isDirty } = form.formState;

  // 3. Callback de sucesso (usado por ambas as funções de salvar)
  const handleSaveSuccess = (data: CharacterSheetData) => {
    form.reset(data); // "Limpa" o formulário (isDirty = false)
    toast({ title: "Ficha Salva!" });
    setIsSaving(false);
  };

  // 4. Callback de erro de validação (usado apenas pelo saveSheet)
  const handleSaveInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  // 5. Callback de erro de submit
  const handleSaveError = (error: any) => {
    console.error("Falha no submit:", error);
    toast({
      title: "Erro ao Salvar",
      description: "Não foi possível salvar a ficha.",
      variant: "destructive",
    });
    setIsSaving(false);
  };

  // 6. FUNÇÃO 1: Salvar com Validação (para botões "Salvar")
  // Esta função usa o handleSubmit do react-hook-form
  const saveSheet = form.handleSubmit(async (data) => {
    setIsSaving(true);
    try {
      await onSave(data);
      handleSaveSuccess(data);
    } catch (error) {
      handleSaveError(error);
    }
  }, handleSaveInvalid);

  // 7. FUNÇÃO 2: Salvar Programaticamente (para diálogos)
  // Esta função pega os dados atuais (sem validar) e salva.
  const programmaticSave = async () => {
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      await onSave(currentData);
      handleSaveSuccess(currentData);
    } catch (error) {
      handleSaveError(error);
    }
  };

  return (
    <CharacterSheetContext.Provider
      value={{
        character,
        form,
        isDirty,
        isSaving,
        saveSheet, // Exporta o salvamento com validação
        programmaticSave, // Exporta o salvamento rápido
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