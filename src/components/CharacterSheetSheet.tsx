// src/components/CharacterSheetSheet.tsx

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { CharacterSheet } from "@/features/character/CharacterSheet";
import { CharacterSheetProvider } from "@/features/character/CharacterSheetContext";
import { useToast } from "@/hooks/use-toast";

interface CharacterSheetSheetProps {
  children?: React.ReactNode;
  characterId: string | null;
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}

// Faz o fetch na tabela 'characters'
const fetchCharacter = async (characterId: string) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const CharacterSheetSheet = ({ 
  children, 
  characterId, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: CharacterSheetSheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  const {
    data: character,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => fetchCharacter(characterId!),
    enabled: open && !!characterId,
    placeholderData: (previousData) => previousData,
  });

  // Função de Salvar necessária para o Provider
  const handleSave = async (formData: any) => {
    if (!characterId) return;

    try {
      const { error } = await supabase
        .from("characters")
        .update({ 
            data: formData,
            name: formData.name // Atualiza também a coluna nome na tabela
        })
        .eq("id", characterId);

      if (error) throw error;

      // Invalida as caches para atualizar listas e a própria ficha
      await queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      if (character?.table_id) {
          await queryClient.invalidateQueries({ queryKey: ["characters", character.table_id] });
      }

    } catch (err: any) {
      console.error("Erro ao salvar personagem:", err);
      toast({
        title: "Erro ao Salvar",
        description: err.message,
        variant: "destructive",
      });
      throw err; // Re-lança para que o Contexto saiba que falhou
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent className="w-full sm:max-w-3xl p-0 bg-background overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">
          {character?.name || "Ficha de Personagem"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Edite ou visualize a ficha do personagem.
        </SheetDescription>

        {isLoading && !character && (
          <div className="p-6 space-y-4 flex flex-col items-center justify-center h-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">A carregar grimório...</p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Ficha</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {/* AQUI ESTÁ A CORREÇÃO: Envolver a CharacterSheet no Provider */}
        {character && (
          <CharacterSheetProvider character={character} onSave={handleSave}>
             <CharacterSheet isReadOnly={false} />
          </CharacterSheetProvider>
        )}
      </SheetContent>
    </Sheet>
  );
};