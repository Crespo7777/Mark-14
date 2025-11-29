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
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Share2,
  Eye
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
import { JournalRenderer } from "@/components/JournalRenderer";
import { EntityListManager } from "@/components/EntityListManager";
import { JournalEntryWithRelations, FolderType } from "@/types/app-types";
import { JournalReadDialog } from "@/components/JournalReadDialog";
import { useTableContext } from "@/features/table/TableContext";

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px]">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

const fetchJournalEntries = async (tableId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)`)
    .eq("table_id", tableId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntryWithRelations[];
};

const fetchFolders = async (tableId: string) => {
  const { data, error } = await supabase.from("journal_folders").select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

export const MasterJournalTab = ({ tableId }: { tableId: string }) => {
  const { members } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [journalSearch, setJournalSearch] = useState("");
  const [showArchivedJournal, setShowArchivedJournal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntryWithRelations | null>(null);
  const [entryToRead, setEntryToRead] = useState<JournalEntryWithRelations | null>(null);

  const { data: journalEntries = [], isLoading: isLoadingJournal } = useQuery({
    queryKey: ['journal', tableId],
    queryFn: () => fetchJournalEntries(tableId),
  });
  const { data: folders = [] } = useQuery({
    queryKey: ['journal_folders', tableId],
    queryFn: () => fetchFolders(tableId),
  });

  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    await supabase.from("journal_entries").delete().eq("id", entryToDelete.id);
    toast({ title: "Entrada excluída" });
    invalidateJournal();
    setEntryToDelete(null);
  };

  const handleArchiveItem = async (id: string, currentValue: boolean) => {
    await supabase.from("journal_entries").update({ is_archived: !currentValue }).eq("id", id);
    toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
    invalidateJournal();
  };

  const handleMoveItem = async (id: string, folderId: string | null) => {
    await supabase.from("journal_entries").update({ folder_id: folderId }).eq("id", id);
    toast({ title: "Movido com sucesso" });
    invalidateJournal();
  };

  const handleUpdateSharing = async (id: string, players: string[]) => {
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && players.length === allPlayerIds.length;
    await supabase.from("journal_entries").update({ shared_with_players: players, is_shared: isShared }).eq("id", id);
    toast({ title: "Partilha atualizada" });
    invalidateJournal();
  };

  const filteredEntries = journalEntries.filter(entry => {
    const name = entry.title || "";
    const matchesSearch = name.toLowerCase().includes(journalSearch.toLowerCase());
    const matchesArchive = showArchivedJournal ? entry.is_archived : !entry.is_archived;
    return matchesSearch && matchesArchive;
  });

  const renderJournalCard = (entry: JournalEntryWithRelations) => {
     let description = "Anotação do Mestre";
     let canShare = true;
     if (entry.player) { description = `De: ${entry.player.display_name}`; canShare = false; }
     else if (entry.character) { description = `Personagem: ${entry.character.name}`; canShare = false; }
     else if (entry.npc) { description = `NPC: ${entry.npc.name}`; canShare = false; }
     else if (entry.is_shared) { description = "Público"; }
     
     return (
        <Card 
          className={`border-border/50 flex flex-col h-[280px] hover:shadow-glow transition-shadow cursor-pointer group ${entry.is_archived ? "opacity-60 bg-muted/20" : ""}`}
          onClick={() => setEntryToRead(entry)}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start text-lg truncate">
                    <span className="truncate pr-2">{entry.title}</span>
                    {entry.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded shrink-0">Arq</span>}
                </CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden text-sm pt-2 pb-2 relative">
                <JournalRenderer content={entry.content} className="line-clamp-6 text-sm" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <span className="bg-background/80 px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm"><Eye className="w-3 h-3 mr-1" /> Ler</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-0 pb-3 px-4 h-12" onClick={(e) => e.stopPropagation()}>
                <div>
                    {canShare ? (
                        <ShareDialog itemTitle={entry.title} currentSharedWith={entry.shared_with_players || []} onSave={(ids) => handleUpdateSharing(entry.id, ids)}>
                            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
                        </ShareDialog>
                    ) : <div/>}
                </div>
                <div className="flex gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, !!entry.is_archived)}>
                                {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                                {entry.is_archived ? "Restaurar" : "Arquivar"}
                             </DropdownMenuItem>
                             {canShare && (
                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={entry.folder_id || "none"} onValueChange={val => handleMoveItem(entry.id, val === "none" ? null : val)}>
                                            <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                                            {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                 </DropdownMenuSub>
                             )}
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive" onClick={() => setEntryToDelete(entry)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} entry={entry} isPlayerNote={!!entry.player_id} characterId={entry.character_id || undefined} npcId={entry.npc_id || undefined}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        </JournalEntryDialog>
                    </Suspense>
                </div>
            </CardFooter>
        </Card>
     );
  };

  if (isLoadingJournal) return <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div>;

  return (
    <>
        <EntityListManager
            items={filteredEntries}
            folders={folders}
            searchTerm={journalSearch}
            onSearch={setJournalSearch}
            showArchived={showArchivedJournal}
            onToggleArchived={setShowArchivedJournal}
            renderItem={renderJournalCard}
            emptyMessage="Nenhuma anotação encontrada."
            gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" // <--- CORREÇÃO DO LAYOUT AQUI
            actions={
                <>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Diário" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Entrada</Button>
                        </JournalEntryDialog>
                    </Suspense>
                </>
            }
        />

        <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir esta Entrada?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <JournalReadDialog open={!!entryToRead} onOpenChange={(open) => !open && setEntryToRead(null)} entry={entryToRead} />
    </>
  );
};