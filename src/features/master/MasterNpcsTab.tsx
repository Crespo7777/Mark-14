import { useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, Archive, ArchiveRestore, Plus } from "lucide-react";
import { ManageFoldersDialog } from "@/components/ManageFoldersDialog";
import { useToast } from "@/hooks/use-toast";
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
import { CreateNpcDialog } from "@/components/CreateNpcDialog";
import { EntityListManager } from "@/components/EntityListManager";
import { NpcWithRelations, FolderType } from "@/types/app-types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShareDialog } from "@/components/ShareDialog";
import { useTableContext } from "@/features/table/TableContext";

const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const fetchNpcs = async (tableId: string) => {
  const { data, error } = await supabase
    .from("npcs")
    .select("*, shared_with_players")
    .eq("table_id", tableId)
    .order("name", { ascending: true });
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

  const [showArchivedNpcs, setShowArchivedNpcs] = useState(false);
  const [npcToDelete, setNpcToDelete] = useState<NpcWithRelations | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [itemToShare, setItemToShare] = useState<NpcWithRelations | null>(null);

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

  // HANDLERS
  const handleDeleteNpc = async () => {
    if (!npcToDelete) return;
    await supabase.from("journal_entries").update({ npc_id: null }).eq("npc_id", npcToDelete.id);
    await supabase.from("npcs").delete().eq("id", npcToDelete.id);
    toast({ title: "NPC excluído" });
    invalidateNpcs();
    invalidateJournal(); 
    setNpcToDelete(null);
  };

  const handleDuplicate = async (npc: any) => {
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
  };

  const handleArchive = async (id: string, currentValue: boolean) => {
    await supabase.from("npcs").update({ is_archived: !currentValue }).eq("id", id);
    toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
    invalidateNpcs();
  };

  const handleMove = async (id: string, folderId: string | null) => {
    await supabase.from("npcs").update({ folder_id: folderId }).eq("id", id);
    toast({ title: "NPC Movido" });
    invalidateNpcs();
  };

  const handleUpdateSharing = async (ids: string[]) => {
    if(!itemToShare) return;
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && ids.length === allPlayerIds.length;
    await supabase.from("npcs").update({ shared_with_players: ids, is_shared: isShared }).eq("id", itemToShare.id);
    toast({ title: "Partilha atualizada" });
    invalidateNpcs();
    setItemToShare(null);
  };

  const displayedNpcs = npcs.filter(npc => 
    showArchivedNpcs ? npc.is_archived : !npc.is_archived
  );

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* BARRA DE TOPO */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-1">
            <div className="flex items-center gap-2">
                <ManageFoldersDialog tableId={tableId} folders={folders} tableName="npc_folders" title="NPCs" />
                <div className="flex items-center space-x-2 bg-card border px-3 py-1.5 rounded-md shadow-sm">
                    <Switch id="show-archived-npc" checked={showArchivedNpcs} onCheckedChange={setShowArchivedNpcs} />
                    <Label htmlFor="show-archived-npc" className="cursor-pointer text-sm font-medium">
                        {showArchivedNpcs ? "Ver Ativos" : "Ver Arquivados"}
                    </Label>
                </div>
            </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 min-h-0">
            <EntityListManager
                title="NPCs"
                type="npc"
                items={displayedNpcs}
                folders={folders}
                isLoading={isLoadingNpcs}
                
                onEdit={(id) => setSelectedNpcId(id)}
                onDelete={(id) => {
                    const npc = npcs.find(n => n.id === id);
                    if (npc) setNpcToDelete(npc);
                }}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onMove={handleMove}
                onShare={(item) => setItemToShare(item)}
                
                // --- CORREÇÃO DO BOTÃO DE CRIAR ---
                actions={
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <CreateNpcDialog tableId={tableId} onNpcCreated={invalidateNpcs}>
                            <Button size="sm" className="h-9 shadow-sm">
                                <Plus className="h-4 w-4 mr-1" /> Novo NPC
                            </Button>
                        </CreateNpcDialog>
                    </Suspense>
                }
            />
        </div>

        {/* MODAIS */}
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

        {itemToShare && (
          <ShareDialog 
            itemTitle={itemToShare.name} 
            currentSharedWith={itemToShare.shared_with_players || []} 
            onSave={handleUpdateSharing}
            open={!!itemToShare} 
            onOpenChange={(open) => !open && setItemToShare(null)}
          >
             <span className="hidden"></span>
          </ShareDialog>
        )}

        <AlertDialog open={!!npcToDelete} onOpenChange={(open) => !open && setNpcToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este NPC?</AlertDialogTitle>
                    <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteNpc} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};