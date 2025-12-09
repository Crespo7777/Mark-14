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
  Eye,
  Loader2
} from "lucide-react";
// Removido ShareDialog e Share2
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

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px]">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

// --- OTIMIZAÇÃO: Select leve sem 'content' ---
const fetchPlayerJournal = async (tableId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`
      id, 
      title, 
      created_at,
      is_shared,
      is_archived,
      is_hidden_on_sheet,
      folder_id,
      data,
      player_id,
      character_id,
      npc_id,
      shared_with_players,
      player:profiles!journal_entries_player_id_fkey(display_name), 
      character:characters!journal_entries_character_id_fkey(name), 
      npc:npcs!journal_entries_npc_id_fkey(name)
    `) // SEM 'content'
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

export const PlayerJournalTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [journalSearch, setJournalSearch] = useState("");
  const [showArchivedJournal, setShowArchivedJournal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntryWithRelations | null>(null);
  const [entryToRead, setEntryToRead] = useState<JournalEntryWithRelations | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntryWithRelations | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<string | null>(null);

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

  // --- OTIMIZAÇÃO: Carregar conteúdo sob demanda ---
  const handleReadEntry = async (entry: JournalEntryWithRelations, mode: 'read' | 'edit' = 'read') => {
    setIsLoadingContent(entry.id);
    try {
        const { data, error } = await supabase
            .from("journal_entries")
            .select("content")
            .eq("id", entry.id)
            .single();

        if (error) throw error;

        const fullEntry = { ...entry, content: data.content };

        if (mode === 'read') setEntryToRead(fullEntry);
        else setEntryToEdit(fullEntry);

    } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar conteúdo.", variant: "destructive" });
    } finally {
        setIsLoadingContent(null);
    }
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

  const filteredEntries = journalEntries.filter(e => {
    const isSharedWithMe = (e.shared_with_players || []).includes(userId!);
    const canSee = e.player_id === userId || (e.character && e.character_id) || isSharedWithMe || e.is_shared;
    if (!canSee) return false;

    const name = e.title || "";
    const matchesSearch = name.toLowerCase().includes(journalSearch.toLowerCase());
    const matchesArchive = showArchivedJournal ? e.is_archived : !e.is_archived;
    return matchesSearch && matchesArchive;
  });

  const renderJournalCard = (entry: JournalEntryWithRelations) => {
    let description = "Anotação Pública";
    let isMyEntry = false;
    const isSharedWithMe = (entry.shared_with_players || []).includes(userId);
    const isLoadingThis = isLoadingContent === entry.id;
    
    if (entry.player_id === userId) { description = "Sua Anotação"; isMyEntry = true; } 
    else if (entry.character) { description = `Diário: ${entry.character.name}`; isMyEntry = true; }
    else if (isSharedWithMe) { description = "Partilhado com você"; }
    else if (entry.is_shared) { description = "Público"; }

    const canEdit = isMyEntry || isSharedWithMe;

    return (
      <Card 
        className={`border-border/50 flex flex-col h-[280px] hover:shadow-glow transition-shadow cursor-pointer group relative ${entry.is_archived ? "opacity-60 bg-muted/20" : ""}`}
        onClick={() => !isLoadingThis && handleReadEntry(entry, 'read')}
      >
        {isLoadingThis && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start text-lg truncate">
             <span className="truncate pr-2">{entry.title}</span>
             {entry.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded shrink-0">Arq</span>}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden text-sm pt-2 pb-2 relative">
            <div className="text-muted-foreground italic text-xs">
                Clique para carregar o conteúdo...
            </div>
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <span className="bg-background/80 px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
                   <Eye className="w-3 h-3 mr-1" /> Ler
                </span>
            </div>
        </CardContent>

        <CardFooter className="flex justify-end items-center pt-0 pb-3 px-4 gap-2 h-12" onClick={e => e.stopPropagation()}>
             {isMyEntry && (
                 <div className="flex gap-1">
                     {/* BOTÃO DE PARTILHA REMOVIDO DAQUI */}

                     <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, !!entry.is_archived)}>
                                {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                                {entry.is_archived ? "Restaurar" : "Arquivar"}
                             </DropdownMenuItem>
                             <DropdownMenuSub>
                                <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={entry.folder_id || "none"} onValueChange={val => handleMoveItem(entry.id, val === "none" ? null : val)}>
                                        <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                                        {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                             </DropdownMenuSub>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive" onClick={() => setEntryToDelete(entry)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                 </div>
             )}
            
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReadEntry(entry, 'edit')}>
                  <Edit className="w-4 h-4" />
              </Button>
            )}
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
            gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            actions={
               <>
                   <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Minhas Pastas" />
                   <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} isPlayerNote={true}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Anotação</Button>
                        </JournalEntryDialog>
                   </Suspense>
               </>
            }
        />

        <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <JournalReadDialog open={!!entryToRead} onOpenChange={(open) => !open && setEntryToRead(null)} entry={entryToRead} />

        {/* Diálogo de Edição para Players */}
        {entryToEdit && (
            <Suspense fallback={null}>
                <JournalEntryDialog 
                    tableId={tableId} 
                    onEntrySaved={invalidateJournal} 
                    entry={entryToEdit} 
                    isPlayerNote={!!entryToEdit.player_id} 
                    characterId={entryToEdit.character_id || undefined} 
                    npcId={entryToEdit.npc_id || undefined}
                >
                    <span className="hidden">Trigger Invisível</span>
                </JournalEntryDialog>
            </Suspense>
        )}
    </>
  );
};