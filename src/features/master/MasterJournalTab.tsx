// src/features/master/MasterJournalTab.tsx

import { useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  Plus,
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Share2
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
import { useTableContext } from "@/features/table/TableContext";

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
    <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
  </Card>
);

type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
  folder_id?: string | null;
  is_archived?: boolean;
};
type FolderType = { id: string; name: string };

const fetchJournalEntries = async (tableId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)`)
    .eq("table_id", tableId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
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
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

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
    const { error } = await supabase.from("journal_entries").update({ is_archived: !currentValue }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
        invalidateJournal();
    }
  };

  const handleMoveItem = async (id: string, folderId: string | null) => {
    const { error } = await supabase.from("journal_entries").update({ folder_id: folderId }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: "Movido com sucesso" });
        invalidateJournal();
    }
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

  const entriesInFolders = folders.map(f => ({
    ...f,
    items: filteredEntries.filter(i => i.folder_id === f.id)
  }));
  const entriesNoFolder = filteredEntries.filter(i => !i.folder_id);

  const JournalCard = ({ entry }: { entry: JournalEntry }) => {
     let description = "Anotação do Mestre";
     let canShare = true;
     if (entry.player) { description = `De: ${entry.player.display_name}`; canShare = false; }
     else if (entry.character) { description = `Personagem: ${entry.character.name}`; canShare = false; }
     else if (entry.npc) { description = `NPC: ${entry.npc.name}`; canShare = false; }
     else if (entry.is_shared) { description = "Público"; }
     
     return (
        <Card className={`border-border/50 flex flex-col ${entry.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    {entry.title}
                    {entry.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1"><JournalRenderer content={entry.content} className="line-clamp-3" /></CardContent>
            <CardFooter className="flex justify-between items-center">
                <div onClick={e => e.stopPropagation()}>
                    {canShare ? (
                        <ShareDialog itemTitle={entry.title} currentSharedWith={entry.shared_with_players || []} onSave={(ids) => handleUpdateSharing(entry.id, ids)}>
                            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
                        </ShareDialog>
                    ) : <div/>}
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
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
                            <Button variant="outline" size="icon"><Edit className="w-4 h-4" /></Button>
                        </JournalEntryDialog>
                    </Suspense>
                </div>
            </CardFooter>
        </Card>
     );
  };

  return (
    <div className="space-y-4">
         <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar no Diário..." value={journalSearch} onChange={(e) => setJournalSearch(e.target.value)} className="h-9" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="show-archived-journal" checked={showArchivedJournal} onCheckedChange={setShowArchivedJournal} />
                        <Label htmlFor="show-archived-journal" className="text-sm cursor-pointer">Arquivados</Label>
                    </div>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Diário" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Entrada</Button>
                        </JournalEntryDialog>
                    </Suspense>
                </div>
            </div>

            {isLoadingJournal ? <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div> : (
               <div className="space-y-6">
                  {entriesInFolders.length > 0 && (
                     <Accordion type="multiple" className="w-full space-y-2">
                        {entriesInFolders.map(f => (
                           <AccordionItem key={f.id} value={f.id} className="border rounded-lg bg-card px-4">
                              <AccordionTrigger className="hover:no-underline py-3">
                                 <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><span className="font-semibold">{f.name}</span><span className="text-muted-foreground text-sm ml-2">({f.items.length})</span></div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 pb-4">
                                 <div className="grid gap-4 md:grid-cols-2">{f.items.map(e => <JournalCard key={e.id} entry={e} />)}</div>
                              </AccordionContent>
                           </AccordionItem>
                        ))}
                     </Accordion>
                  )}
                  {entriesNoFolder.length > 0 && (
                     <div>
                        {folders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Outros</h4>}
                        <div className="grid gap-4 md:grid-cols-2">{entriesNoFolder.map(e => <JournalCard key={e.id} entry={e} />)}</div>
                     </div>
                  )}
                  {filteredEntries.length === 0 && <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">Nenhuma anotação encontrada.</p>}
               </div>
            )}
         </div>

        <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir esta Entrada?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};