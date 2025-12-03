import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NpcSheet } from "@/features/npc/NpcSheet";
import { CharacterSheet } from "@/features/character/CharacterSheet";
import { NpcSheetProvider } from "@/features/npc/NpcSheetContext";
import { CharacterSheetProvider } from "@/features/character/CharacterSheetContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTableContext } from "@/features/table/TableContext";

interface SheetViewerProps {
  // Simplificado: Agora só esperamos tipos suportados visualmente
  entity: { type: string, id: string, name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SheetViewer = ({ entity, isOpen, onClose }: SheetViewerProps) => {
  // Proteção: Se for um tipo que não suportamos aqui (ex: item), não abre nada.
  if (!entity || !isOpen) return null;
  if (entity.type !== 'character' && entity.type !== 'npc') return null;

  const getHeaderInfo = () => {
    switch (entity.type) {
        case 'character': return { label: 'PERSONAGEM', color: 'default' };
        case 'npc': return { label: 'NPC', color: 'secondary' };
        default: return { label: 'OUTRO', color: 'outline' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Z-Index 9999 para garantir prioridade visual */}
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[650px] p-0 bg-background/95 backdrop-blur-md border-l border-border/40 flex flex-col z-[9999] shadow-2xl"
      >
        <VisuallyHidden>
            <SheetDescription>Ficha de {entity.name}</SheetDescription>
        </VisuallyHidden>

        <SheetHeader className="px-6 py-4 border-b border-border/40 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold flex items-center gap-3">
                    <span className="line-clamp-1">{entity.name}</span>
                    <Badge variant={headerInfo.color as any} className="uppercase text-[10px] tracking-wider">
                        {headerInfo.label}
                    </Badge>
                </SheetTitle>
            </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-full bg-background/50">
            <div className="p-0 pb-20 min-h-full">
               <SheetLoader key={entity.id} entity={entity} />
            </div>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  );
};

const SheetLoader = ({ entity }: { entity: { type: string, id: string } }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    let userId: string | null = null;
    try {
        const context = useTableContext();
        userId = context.userId;
    } catch (e) { /* Fallback seguro */ }

    const tableName = entity.type === 'character' ? 'characters' : 'npcs';

    const { data, isLoading, error } = useQuery({
        queryKey: ['sheet-viewer', entity.type, entity.id], 
        queryFn: async () => {
            const { data, error } = await supabase
                .from(tableName)
                .select("*")
                .eq("id", entity.id)
                .maybeSingle();
                
            if (error) throw error;
            if (!data) throw new Error("Ficha não encontrada.");
            return data;
        },
        enabled: !!entity.id,
        staleTime: 1000 * 60 * 2, // 2 minutos de cache
        retry: 1
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-muted-foreground animate-in fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm">Abrindo ficha...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-destructive p-6 text-center">
                <AlertCircle className="w-12 h-12" />
                <p className="font-semibold">Erro ao carregar</p>
                <p className="text-xs text-muted-foreground">{(error as any)?.message}</p>
            </div>
        );
    }

    // Permissões
    const isOwner = userId && (
        (data.player_id && data.player_id === userId) || 
        (data.created_by && data.created_by === userId)
    );
    const isReadOnly = !isOwner;

    const handleSave = async (formData: any) => {
        if (isReadOnly) {
             toast({ title: "Acesso Negado", description: "Modo de leitura apenas.", variant: "destructive" });
             return;
        }
        const { error } = await supabase.from(tableName).update({ data: formData }).eq("id", entity.id);
        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" }); 
        else {
            toast({ title: "Salvo", description: "Ficha atualizada." });
            queryClient.invalidateQueries({ queryKey: ['sheet-viewer', entity.type, entity.id] });
        }
    };

    if (entity.type === 'npc') {
        return (
            <div className="relative">
                {isReadOnly && <ReadOnlyBadge />}
                <NpcSheetProvider npc={data} onSave={handleSave}>
                    <div className="p-4"><NpcSheet isReadOnly={isReadOnly} /></div>
                </NpcSheetProvider>
            </div>
        );
    }

    // entity.type === 'character'
    return (
        <div className="relative">
            {isReadOnly && <ReadOnlyBadge />}
            <CharacterSheetProvider character={data} onSave={handleSave}>
                <div className="p-4"><CharacterSheet isReadOnly={isReadOnly} /></div>
            </CharacterSheetProvider>
        </div>
    );
};

const ReadOnlyBadge = () => (
    <div className="sticky top-0 z-50 w-full bg-amber-500/10 text-amber-500 text-xs font-bold text-center py-1 border-b border-amber-500/20 backdrop-blur-sm flex items-center justify-center gap-2">
        <Lock className="w-3 h-3" /> MODO LEITURA
    </div>
);