import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
// Importa o Roteador de Fichas
import { CharacterSheet } from "@/features/character/CharacterSheet";

interface CharacterSheetSheetProps {
  children?: React.ReactNode;
  characterId: string | null;
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
  isReadOnly?: boolean; 
}

export const CharacterSheetSheet = ({ 
  children, 
  characterId, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  isReadOnly = false
}: CharacterSheetSheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Lógica para permitir controle interno ou externo
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent 
        className="w-full sm:max-w-3xl p-0 bg-background overflow-hidden flex flex-col border-l border-border shadow-2xl"
        side="right"
      >
        <SheetTitle className="sr-only">Ficha de Personagem</SheetTitle>
        <SheetDescription className="sr-only">Visualizar e editar detalhes</SheetDescription>

        {/* AQUI ESTAVA O PROBLEMA:
           Agora passamos explicitamente o characterId. 
           O componente 'CharacterSheet' (Roteador) vai receber este ID,
           verificar qual é o sistema da mesa (Symbaroum/Pathfinder),
           e carregar a ficha correta que por sua vez carrega os seus próprios dados.
        */}
        {characterId && (
             <CharacterSheet 
                characterId={characterId} 
                isReadOnly={isReadOnly} 
             />
        )}
      </SheetContent>
    </Sheet>
  );
};