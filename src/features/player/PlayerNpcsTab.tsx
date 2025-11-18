// src/features/player/PlayerNpcsTab.tsx

import { useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Folder, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const NpcLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

type Npc = Database["public"]["Tables"]["npcs"]["Row"] & {
  folder_id?: string | null;
  is_archived?: boolean;
};
type FolderType = { id: string; name: string };

const fetchSharedNpcs = async (tableId: string) => {
  const { data, error } = await supabase.from("npcs").select("*, shared_with_players").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as Npc[];
};

const fetchFolders = async (tableId: string) => {
  const { data, error } = await supabase.from("npc_folders").select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

export const PlayerNpcsTab = ({ tableId }: { tableId: string }) => {
  const [npcSearch, setNpcSearch] = useState("");

  const { data: sharedNpcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchSharedNpcs(tableId),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['npc_folders', tableId],
    queryFn: () => fetchFolders(tableId),
  });

  // Filtra para pesquisa
  const filteredNpcs = sharedNpcs.filter(npc => 
      npc.name.toLowerCase().includes(npcSearch.toLowerCase())
      // Nota: Jogadores geralmente não veem 'arquivados' do Mestre, a menos que o mestre queira.
      // Aqui assumimos que só mostramos ativos por padrão na lista partilhada.
  );

  const npcsInFolders = folders.map(f => ({
    ...f,
    items: filteredNpcs.filter(n => n.folder_id === f.id)
  }));
  const npcsNoFolder = filteredNpcs.filter(n => !n.folder_id);

  const NpcCard = ({ npc }: { npc: Npc }) => (
    <Suspense key={npc.id} fallback={<NpcLoadingFallback />}>
      <NpcSheetSheet npcId={npc.id}>
        <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> {npc.name}</CardTitle>
            <CardDescription>NPC compartilhado</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Clique para ver</p></CardContent>
        </Card>
      </NpcSheetSheet>
    </Suspense>
  );

  return (
    <div className="space-y-4">
         <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                 <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar NPC..." value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)} className="h-9" />
                 </div>
             </div>

             {isLoadingNpcs ? <div className="grid gap-4 md:grid-cols-2"><NpcLoadingFallback /><NpcLoadingFallback /></div> : (
                <div className="space-y-6">
                   {/* Para NPCs, usamos as pastas do Mestre, mas só mostramos se tiver NPCs partilhados dentro */}
                   {npcsInFolders.length > 0 && (
                       <Accordion type="multiple" className="w-full space-y-2">
                          {npcsInFolders.map(f => (
                             f.items.length > 0 && (
                               <AccordionItem key={f.id} value={f.id} className="border rounded-lg bg-card px-4">
                                  <AccordionTrigger className="hover:no-underline py-3">
                                     <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><span className="font-semibold">{f.name}</span><span className="text-muted-foreground text-sm ml-2">({f.items.length})</span></div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-2 pb-4">
                                     <div className="grid gap-4 md:grid-cols-2">{f.items.map(n => <NpcCard key={n.id} npc={n} />)}</div>
                                  </AccordionContent>
                               </AccordionItem>
                             )
                          ))}
                       </Accordion>
                   )}
                   {npcsNoFolder.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2">{npcsNoFolder.map(n => <NpcCard key={n.id} npc={n} />)}</div>
                   )}
                   {filteredNpcs.length === 0 && <p className="text-muted-foreground text-center py-12">Nenhum NPC partilhado encontrado.</p>}
                </div>
             )}
           </div>
    </div>
  );
};