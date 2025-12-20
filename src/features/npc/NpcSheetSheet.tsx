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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { NpcSheet } from "@/features/npc/NpcSheet";

interface NpcSheetSheetProps {
  children?: React.ReactNode;
  npcId: string | null; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}

const fetchNpc = async (npcId: string) => {
  // CORREÇÃO: Tabela 'npcs'
  const { data, error } = await supabase
    .from("npcs")
    .select("*")
    .eq("id", npcId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const NpcSheetSheet = ({ 
  children, 
  npcId, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: NpcSheetSheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  const {
    data: npc,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["npc", npcId],
    queryFn: () => fetchNpc(npcId!),
    enabled: !!open && !!npcId, 
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent className="w-full sm:max-w-3xl p-0 bg-background overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">Ficha de NPC</SheetTitle>
        <SheetDescription className="sr-only">Detalhes do NPC</SheetDescription>

        {isLoading && !npc && (
          <div className="p-6 h-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-destructive" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {npc && (
           <NpcSheet 
              initialNpc={npc as any} 
              onClose={() => setOpen(false)} 
           />
        )}
      </SheetContent>
    </Sheet>
  );
};