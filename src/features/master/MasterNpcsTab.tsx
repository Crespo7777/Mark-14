// src/features/master/MasterNpcsTab.tsx

import { useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Share2,
  Plus
} from "lucide-react";
import { ShareDialog } from "@/components/ShareDialog";
import { ManageFoldersDialog } from "@/components/ManageFoldersDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableContext } from "@/features/table/TableContext";
import { CreateNpcDialog } from "@/components/CreateNpcDialog";
import { EntityListManager } from "@/components/EntityListManager";
import { NpcWithRelations, FolderType } from "@/types/app-types";

const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px]">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

const fetchNpcs = async (tableId: string) => {
  const { data, error } = await supabase
    .from("npcs")
    .select("*, shared_with_players")
    .eq("table_id", tableId)
    .order("name", { ascending: true }); // <--- GARANTIR ORDEM AQUI TAMBÉM
  if (error) throw error;
  return data as NpcWithRelations[];
};

const fetchFolders = async (tableId: string) => {
  const { data, error } = await supabase.from("npc_folders").select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

export const MasterNpcsTab = ({ tableId }: { tableId: string }) => {
  const { members } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [npcSearch, setNpcSearch] = useState("");
  const [showArchivedNpcs, setShowArchivedNpcs] = useState(false);
  const [npcToDelete, setNpcToDelete] = useState<NpcWithRelations | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  const { data: npcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchNpcs(tableId),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['npc_folders', tableId],
    queryFn: () => fetchFolders(tableId),
  });

  const invalidateNpcs = () => queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  // Handlers
  const handleDeleteNpc = async () => {
    if (!npcToDelete) return;
    await supabase.from("journal_entries").update({ npc_id: null }).eq("npc_id", npcToDelete.id);
    await supabase.from("npcs").delete().eq("id", npcToDelete.id);
    toast({ title: "NPC excluído" });
    invalidateNpcs();
    invalidateJournal(); 
    setNpcToDelete(null);
  };

  const handleDuplicateNpc = async (npc: NpcWithRelations) => {
    setDuplicating(true);
    const newData = JSON.parse(JSON.stringify(npc.data || {}));
    newData.name = `Cópia de ${npc.name}`;
    await supabase.from("npcs").insert({
      table_id: tableId,
      name: newData.name,
      data: newData,
      is_shared: false,
      shared_with_players: [],
      folder_id: npc.folder_id, 
      is_archived: npc.is_archived 
    });
    toast({ title: "NPC Duplicado!" });
    invalidateNpcs();
    setDuplicating(false);
  };

  const handleArchiveNpc = async (id: string, currentValue: boolean) => {
    const { error } = await supabase.from("npcs").update({ is_archived: !currentValue }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
        invalidateNpcs();
    }
  };

  const handleMoveNpc = async (npcId: string, folderId: string | null) => {
    const { error } = await supabase.from("npcs").update({ folder_id: folderId }).eq("id", npcId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: "NPC Movido" });
        invalidateNpcs();
    }
  };

  const handleUpdateSharing = async (id: string, players: string[]) => {
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && players.length === allPlayerIds.length;
    await supabase.from("npcs").update({ shared_with_players: players, is_shared: isShared }).eq("id", id);
    toast({ title: "Partilha atualizada" });
    invalidateNpcs();
  };

  // Filtragem
  const filteredNpcs = npcs.filter(npc => {
    const matchesSearch = npc.name.toLowerCase().includes(npcSearch.toLowerCase());
    const matchesArchive = showArchivedNpcs ? npc.is_archived : !npc.is_archived;
    return matchesSearch && matchesArchive;
  });

  const renderNpcCard = (npc: NpcWithRelations) => (
    <Suspense key={npc.id} fallback={<SheetLoadingFallback />}>
      <NpcSheetSheet npcId={npc.id}>
        <Card className={`border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col ${npc.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-start text-lg">
                {npc.name}
                {npc.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
            </CardTitle>
            <CardDescription>
              {npc.is_shared
                ? "Público"
                : (npc.shared_with_players || []).length > 0
                ? `Partilhado (${(npc.shared_with_players || []).length})`
                : "Privado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1"><p className="text-sm text-muted-foreground">Clique para editar</p></CardContent>
          <CardFooter className="flex justify-between items-center pt-0 pb-4 px-4" onClick={e => e.stopPropagation()}>
             <ShareDialog itemTitle={npc.name} currentSharedWith={npc.shared_with_players || []} disabled={duplicating} onSave={(ids) => handleUpdateSharing(npc.id, ids)}>
                <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
             </ShareDialog>
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleDuplicateNpc(npc)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchiveNpc(npc.id, !!npc.is_archived)}>
                     {npc.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                     {npc.is_archived ? "Restaurar" : "Arquivar"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={npc.folder_id || "none"} onValueChange={(val) => handleMoveNpc(npc.id, val === "none" ? null : val)}>
                            <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                            {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setNpcToDelete(npc)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </CardFooter>
        </Card>
      </NpcSheetSheet>
    </Suspense>
  );

  if (isLoadingNpcs) return <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div>;

  return (
    <>
        <EntityListManager
            items={filteredNpcs}
            folders={folders}
            searchTerm={npcSearch}
            onSearch={setNpcSearch}
            showArchived={showArchivedNpcs}
            onToggleArchived={setShowArchivedNpcs}
            renderItem={renderNpcCard}
            emptyMessage="Nenhum NPC encontrado."
            actions={
                <>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="npc_folders" title="NPCs" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <CreateNpcDialog tableId={tableId} onNpcCreated={invalidateNpcs}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo NPC</Button>
                        </CreateNpcDialog>
                    </Suspense>
                </>
            }
        />

        <AlertDialog open={!!npcToDelete} onOpenChange={(open) => !open && setNpcToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir este NPC?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteNpc} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
};