import { useState, lazy, Suspense, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EntityListManager } from "@/components/EntityListManager";
import { NpcWithRelations } from "@/types/app-types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive, ArchiveRestore } from "lucide-react";

// Lazy load da ficha
const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const fetchSharedNpcs = async (tableId: string) => {
  const { data, error } = await supabase
    .from("npcs")
    .select("*, shared_with_players")
    .eq("table_id", tableId)
    .order("name", { ascending: true });
    
  if (error) throw error;
  return data as NpcWithRelations[];
};

export const PlayerNpcsTab = ({ tableId }: { tableId: string }) => {
  const [showArchived, setShowArchived] = useState(false);
  
  // Estado para controlar qual ficha está aberta
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);

  const { data: sharedNpcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchSharedNpcs(tableId),
  });

  const displayedNpcs = sharedNpcs.filter(npc => 
      showArchived ? true : !npc.is_archived
  );

  // Achatamento da lista para o jogador (remove pastas visualmente)
  const flatNpcs = useMemo(() => {
      return displayedNpcs.map(npc => ({
          ...npc,
          folder_id: null 
      }));
  }, [displayedNpcs]);

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* BARRA DE FILTROS */}
        <div className="flex justify-end p-1">
            <div className="flex items-center space-x-2 bg-card border px-3 py-1.5 rounded-md shadow-sm">
                <Switch id="show-archived-npc-p" checked={showArchived} onCheckedChange={setShowArchived} />
                <Label htmlFor="show-archived-npc-p" className="cursor-pointer text-sm font-medium flex items-center gap-2">
                    {showArchived ? <ArchiveRestore className="w-4 h-4"/> : <Archive className="w-4 h-4"/>}
                    {showArchived ? "Mostrar Arquivados" : "Ocultar Arquivados"}
                </Label>
            </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 min-h-0">
            <EntityListManager
                title="NPCs Partilhados"
                type="npc"
                items={flatNpcs}      
                folders={[]}          
                isLoading={isLoadingNpcs}
                
                // CORREÇÃO: Passar onEdit para abrir a ficha ao clicar
                onEdit={(id) => setSelectedNpcId(id)}
                
                // Jogadores geralmente não apagam NPCs partilhados, passamos função vazia para não quebrar
                onDelete={() => {}} 
                
                emptyMessage="Nenhum NPC partilhado encontrado."
            />
        </div>

        {/* FICHA DE NPC (Carregada sob demanda) */}
        {selectedNpcId && (
            <Suspense fallback={null}>
                <NpcSheetSheet 
                    npcId={selectedNpcId} 
                    // @ts-ignore
                    open={!!selectedNpcId} 
                    onOpenChange={(open: boolean) => !open && setSelectedNpcId(null)}
                />
            </Suspense>
        )}
    </div>
  );
};