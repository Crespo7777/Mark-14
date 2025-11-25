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
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CharacterSheet } from "@/features/character/CharacterSheet";

interface CharacterSheetSheetProps {
  children?: React.ReactNode; // Opcional agora
  characterId: string | null;
  open?: boolean; // Controlo externo
  onOpenChange?: (open: boolean) => void; // Controlo externo
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
  // Estado interno para quando usado como Wrapper (legado)
  const [internalOpen, setInternalOpen] = useState(false);

  // Decide se usa o estado externo (passado pelo Pai) ou interno
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Só renderiza o Trigger se houver children */}
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent className="w-full sm:max-w-3xl p-0">
        <SheetTitle className="sr-only">
          {character?.name || "Ficha de Personagem"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Edite ou visualize a ficha do personagem.
        </SheetDescription>

        {isLoading && !character && (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Ficha</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {character && (
          <CharacterSheet initialCharacter={character} onClose={() => setOpen(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
};