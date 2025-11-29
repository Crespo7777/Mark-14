// src/features/npc/NpcSheetSheet.tsx

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
import { NpcSheet } from "./NpcSheet"; 

interface NpcSheetSheetProps {
  children: React.ReactNode;
  npcId: string;
}

const fetchNpc = async (npcId: string) => {
  const { data, error } = await supabase
    .from("npcs")
    .select("*")
    .eq("id", npcId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const NpcSheetSheet = ({ children, npcId }: NpcSheetSheetProps) => {
  const [open, setOpen] = useState(false);

  const {
    data: npc,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["npc", npcId],
    queryFn: () => fetchNpc(npcId),
    enabled: open, 
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl p-0 bg-background overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">
          {npc?.name || "Ficha de NPC"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Edite ou visualize a ficha do NPC.
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
            <AlertTitle>Erro ao Carregar NPC</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {npc && <NpcSheet initialNpc={npc} onClose={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
};