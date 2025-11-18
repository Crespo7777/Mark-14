// src/features/player/PlayerJournalTab.tsx

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

const fetchPlayerJournal = async (tableId: string) => {
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

export const PlayerJournalTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [journalSearch, setJournalSearch] = useState("");
  const [showArchivedJournal, setShowArchivedJournal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const { data: journalEntries = [], isLoading: isLoadingJournal } = useQuery({
    queryKey: ['journal', tableId],
    queryFn: () => fetchPlayerJournal(tableId),
    enabled: !!userId,
  });
  const { data: folders = [] } = useQuery({
    queryKey: ['journal_folders', tableId],
    queryFn: () => fetchFolders(tableId),
    enabled: !!userId,
  });

  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

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

  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Anotação excluída" });
      invalidateJournal();
    }
    setEntryToDelete(null);
  };

  const handleUpdateSharing = async (id: string, players: string[]) => {
     // Jogadores não podem partilhar "com todos", apenas com o Mestre (automático) ou outros jogadores?
     // No sistema atual, 'shared_with_players' é para outros players.
     await supabase.from("journal_entries").update({ shared_with_players: players }).eq("id", id);
     toast({ title: "Partilha atualizada" });
     invalidateJournal();
  };

  const filteredEntries = journalEntries.filter(e => {
    // Filtro de visibilidade (segurança de UI)
    const isSharedWithMe = (e.shared_with_players || []).includes(userId!);
    const canSee = e.player_id === userId || (e.character && e.character_id) || isSharedWithMe || e.is_shared;
    if (!canSee) return false;

    const name = e.title || "";
    const matchesSearch = name.toLowerCase().includes(journalSearch.toLowerCase());
    const matchesArchive = showArchivedJournal ? e.is_archived : !e.is_archived;
    return matchesSearch && matchesArchive;
  });

  const entriesInFolders = folders.map(f => ({
    ...f,
    items: filteredEntries.filter(i => i.folder_id === f.id)
  }));
  const entriesNoFolder = filteredEntries.filter(i => !i.folder_id);

  const JournalCard = ({ entry }: { entry: JournalEntry }) => {
    let description = "Anotação Pública";
    let isMyEntry = false;
    if (!userId) return null;
    const isSharedWithMe = (entry.shared_with_players || []).includes(userId);
    
    if (entry.player_id === userId) { description = "Sua Anotação"; isMyEntry = true; } 
    else if (entry.character) { description = `Diário: ${entry.character.name}`; isMyEntry = true; } // Assume dono do char
    else if (isSharedWithMe) { description = "Partilhado com você"; }
    else if (entry.is_shared) { description = "Público"; }

    const canEdit = isMyEntry || isSharedWithMe;

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
        
        {canEdit && (
          <CardFooter className="flex justify-end items-center gap-2">
             {isMyEntry && (
                 <div className="flex items-center gap-2">
                     <ShareDialog itemTitle={entry.title} currentSharedWith={entry.shared_with_players || []} onSave={(ids) => handleUpdateSharing(entry.id, ids)}>
                        <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
                     </ShareDialog>

                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, !!entry.is_archived)}>
                                {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                                {entry.is_archived ? "Restaurar" : "Arquivar"}
                             </DropdownMenuItem>
                             {!!entry.player_id && (
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
                 </div>
             )}
            
            <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
              <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} entry={entry} isPlayerNote={!!entry.player_id} characterId={entry.character_id || undefined} npcId={entry.npc_id || undefined}>
                <Button variant="outline" size="icon"><Edit className="w-4 h-4" /></Button>
              </JournalEntryDialog>
            </Suspense>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
         <div className="flex flex-col gap-4">
             <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                 <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar..." value={journalSearch} onChange={(e) => setJournalSearch(e.target.value)} className="h-9" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="show-archived-journal" checked={showArchivedJournal} onCheckedChange={setShowArchivedJournal} />
                        <Label htmlFor="show-archived-journal" className="text-sm cursor-pointer">Arquivados</Label>
                    </div>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Minhas Pastas" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} isPlayerNote={true}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Anotação</Button>
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
                       <div className="grid gap-4 md:grid-cols-2">{entriesNoFolder.map(e => <JournalCard key={e.id} entry={e} />)}</div>
                    )}
                    {filteredEntries.length === 0 && <p className="text-muted-foreground text-center py-12">Nenhuma anotação encontrada.</p>}
                </div>
             )}
           </div>

        <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};