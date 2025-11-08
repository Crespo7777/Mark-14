import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle, // 1. Importar
  SheetDescription // 2. Importar
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CharacterSheet } from "@/features/character/CharacterSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CharacterSheetSheetProps {
  children: React.ReactNode;
  characterId: string;
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

export const CharacterSheetSheet = ({ children, characterId }: CharacterSheetSheetProps) => {
  const [open, setOpen] = useState(false);

  const { data: character, isLoading, error } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => fetchCharacter(characterId),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl p-0">
        {/* 3. Adicionar Título e Descrição ocultos para acessibilidade */}
        <SheetTitle className="sr-only">
          {character?.name || "Ficha de Personagem"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Edite ou visualize a ficha do personagem.
        </SheetDescription>

        {isLoading && (
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