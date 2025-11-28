// src/features/vtt/TokenSheetViewer.tsx

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

interface TokenSheetViewerProps {
  entity: { type: 'character' | 'npc', id: string, name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TokenSheetViewer = ({ entity, isOpen, onClose }: TokenSheetViewerProps) => {
  if (!entity) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 bg-background/95 backdrop-blur-sm border-l border-white/10 flex flex-col">
        
        {/* Cabeçalho Fixo */}
        <SheetHeader className="px-6 py-4 border-b border-white/10 bg-muted/20">
            <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    {entity.name}
                    <Badge variant={entity.type === 'npc' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                        {entity.type === 'npc' ? 'NPC / Monstro' : 'Personagem'}
                    </Badge>
                </SheetTitle>
            </div>
        </SheetHeader>

        {/* Conteúdo com Loader */}
        <ScrollArea className="flex-1 h-full">
            <div className="p-4 pb-20">
               {/* Separamos o loader para um sub-componente para usar hooks condicionalmente */}
               <TokenSheetLoader entity={entity} />
            </div>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  );
};

// Componente Interno que gere o Data Fetching
const TokenSheetLoader = ({ entity }: { entity: { type: 'character' | 'npc', id: string } }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Buscar os dados completos da entidade
    const { data, isLoading, error } = useQuery({
        queryKey: [entity.type, entity.id], // Cache único por ID
        queryFn: async () => {
            const table = entity.type === 'character' ? 'characters' : 'npcs';
            const { data, error } = await supabase.from(table).select("*").eq("id", entity.id).single();
            
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>A carregar ficha...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-20 text-red-400">
                <p>Erro ao carregar ficha.</p>
                <p className="text-xs opacity-70">Verifique se o token ainda existe.</p>
            </div>
        );
    }

    // 2. Função de Salvar (Passada para os Providers)
    const handleSave = async (formData: any) => {
        const table = entity.type === 'character' ? 'characters' : 'npcs';
        
        // Atualiza apenas o campo 'data' (JSON)
        const { error } = await supabase.from(table).update({ data: formData }).eq("id", entity.id);
        
        if (error) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
            throw error;
        } else {
            // Atualiza a cache local para refletir as mudanças
            queryClient.invalidateQueries({ queryKey: [entity.type, entity.id] });
            // Opcional: Atualizar lista de tokens se o nome mudar (requer invalidar lista da Dock)
        }
    };

    // 3. Renderizar o Provider correto
    if (entity.type === 'npc') {
        return (
            // IMPORTANTE: Agora passamos o objeto 'npc' completo, não apenas o ID
            <NpcSheetProvider npc={data as any} onSave={handleSave}>
                <NpcSheet isReadOnly={false} />
            </NpcSheetProvider>
        );
    }

    return (
        // IMPORTANTE: Agora passamos o objeto 'character' completo
        <CharacterSheetProvider character={data as any} onSave={handleSave}>
            <CharacterSheet isReadOnly={false} />
        </CharacterSheetProvider>
    );
};