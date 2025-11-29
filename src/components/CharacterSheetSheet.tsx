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

  // --- FUNÇÃO DE SALVAR CORRIGIDA ---
  const handleSave = async (formData: any) => {
    if (!characterId) return;

    try {
      const updatePayload = {
          name: formData.name,            // Salva nome na coluna
          image_url: formData.image_url,  // Salva imagem na coluna (O SEGREDO ESTÁ AQUI)
          data: formData                  // Salva o resto no JSON
      };

      const { error } = await supabase
        .from("characters")
        .update(updatePayload)
        .eq("id", characterId);

      if (error) throw error;

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
      throw err;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent className="w-full sm:max-w-3xl p-0 bg-background overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">Ficha</SheetTitle>
        <SheetDescription className="sr-only">Detalhes</SheetDescription>

        {isLoading && !character && (
          <div className="p-6 h-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {character && (
          <CharacterSheetProvider character={character} onSave={handleSave}>
             <CharacterSheet isReadOnly={false} />
          </CharacterSheetProvider>
        )}
      </SheetContent>
    </Sheet>
  );
};