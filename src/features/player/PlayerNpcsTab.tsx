// src/features/player/PlayerNpcsTab.tsx

import { useState, lazy, Suspense, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityListManager } from "@/components/EntityListManager";
import { NpcWithRelations } from "@/types/app-types";

const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const NpcLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px]">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

const fetchSharedNpcs = async (tableId: string) => {
  // A RLS (Row Level Security) no banco de dados JÁ FILTRA 
  // apenas os NPCs que são públicos ou partilhados com este utilizador.
  const { data, error } = await supabase
    .from("npcs")
    .select("*, shared_with_players")
    .eq("table_id", tableId)
    .order("name", { ascending: true });
    
  if (error) throw error;
  return data as NpcWithRelations[];
};

export const PlayerNpcsTab = ({ tableId }: { tableId: string }) => {
  const [npcSearch, setNpcSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: sharedNpcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchSharedNpcs(tableId),
  });

  // --- FILTRAGEM DE PESQUISA ---
  const filteredNpcs = sharedNpcs.filter(npc => 
      npc.name.toLowerCase().includes(npcSearch.toLowerCase()) &&
      (showArchived ? true : !npc.is_archived)
  );

  // --- ACHATAMENTO DA LISTA (FLAT LIST) ---
  // O Mestre organiza em pastas, mas o Jogador deve ver apenas uma lista limpa.
  // Forçamos folder_id a null para que o EntityListManager não os tente agrupar.
  const flatNpcs = useMemo(() => {
      return filteredNpcs.map(npc => ({
          ...npc,
          folder_id: null // Remove a associação à pasta visualmente
      }));
  }, [filteredNpcs]);

  const renderNpcCard = (npc: NpcWithRelations) => (
    <Suspense key={npc.id} fallback={<NpcLoadingFallback />}>
      <NpcSheetSheet npcId={npc.id}>
        <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" /> 
                {npc.name}
            </CardTitle>
            <CardDescription>NPC</CardDescription>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Clique para ver ficha</p></CardContent>
        </Card>
      </NpcSheetSheet>
    </Suspense>
  );

  if (isLoadingNpcs) return <div className="grid gap-4 md:grid-cols-2"><NpcLoadingFallback /><NpcLoadingFallback /></div>;

  return (
    <EntityListManager
        items={flatNpcs}      // Passamos os NPCs "sem pasta"
        folders={[]}          // Passamos lista de pastas vazia para não mostrar categorias
        searchTerm={npcSearch}
        onSearch={setNpcSearch}
        showArchived={showArchived}
        onToggleArchived={setShowArchived}
        renderItem={renderNpcCard}
        emptyMessage="Nenhum NPC partilhado encontrado."
        actions={<div />} // Sem ações para o jogador
    />
  );
};