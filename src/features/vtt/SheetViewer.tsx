// src/features/vtt/SheetViewer.tsx

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NpcSheet } from "@/features/npc/NpcSheet";
import { CharacterSheet } from "@/features/character/CharacterSheet";
import { NpcSheetProvider } from "@/features/npc/NpcSheetContext";
import { CharacterSheetProvider } from "@/features/character/CharacterSheetContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SheetViewerProps {
  entity: { type: 'character' | 'npc', id: string, name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SheetViewer = ({ entity, isOpen, onClose }: SheetViewerProps) => {
  // Se não houver entidade, não renderiza nada (Evita renderizar Sheet sem conteúdo)
  if (!entity) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 bg-background/95 backdrop-blur-sm border-l border-white/10 flex flex-col z-[100]">
        
        <SheetHeader className="px-6 py-4 border-b border-white/10 bg-muted/20">
            <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    {entity.name}
                    <Badge variant={entity.type === 'npc' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                        {entity.type === 'npc' ? 'NPC' : 'PC'}
                    </Badge>
                </SheetTitle>
            </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-full">
            <div className="p-4 pb-20">
               {/* Componente isolado para gerir o loading de dados */}
               <SheetLoader entity={entity} />
            </div>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  );
};

const SheetLoader = ({ entity }: { entity: { type: 'character' | 'npc', id: string } }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: [entity.type, entity.id], 
        queryFn: async () => {
            const table = entity.type === 'character' ? 'characters' : 'npcs';
            const { data, error } = await supabase.from(table).select("*").eq("id", entity.id).single();
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error || !data) return <div className="text-center py-20 text-red-400">Erro ao carregar ficha.</div>;

    const handleSave = async (formData: any) => {
        const table = entity.type === 'character' ? 'characters' : 'npcs';
        const { error } = await supabase.from(table).update({ data: formData }).eq("id", entity.id);
        if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); throw error; }
        else queryClient.invalidateQueries({ queryKey: [entity.type, entity.id] });
    };

    if (entity.type === 'npc') {
        return (
            <NpcSheetProvider npc={data as any} onSave={handleSave}>
                <NpcSheet isReadOnly={false} />
            </NpcSheetProvider>
        );
    }

    // AQUI ESTAVA O PROBLEMA: Garantimos que 'data' é passado corretamente
    return (
        <CharacterSheetProvider character={data as any} onSave={handleSave}>
            <CharacterSheet isReadOnly={false} />
        </CharacterSheetProvider>
    );
};