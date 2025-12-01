import { useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Share2,
  Eye,
  Book,
  Image as ImageIcon
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
import { EntityListManager } from "@/components/EntityListManager";
import { JournalEntryWithRelations, FolderType } from "@/types/app-types";
import { JournalReadDialog } from "@/components/JournalReadDialog";
import { useTableContext } from "@/features/table/TableContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px] overflow-hidden">
    <Skeleton className="h-full w-full" />
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

  // --- RENDERIZAÇÃO NO ESTILO FOUNDRY VTT (Tiles) ---
  const renderJournalCard = (entry: JournalEntryWithRelations) => {
      let sourceLabel = "";
      if (entry.player) sourceLabel = ` Jogador: ${entry.player.display_name}`;
      else if (entry.character) sourceLabel = ` PJ: ${entry.character.name}`;
      else if (entry.npc) sourceLabel = ` NPC: ${entry.npc.name}`;
      
      const coverUrl = entry.data?.cover_image;
      const canShare = !entry.player && !entry.character && !entry.npc; // Regras de quem pode partilhar
      const timeAgo = formatDistanceToNow(new Date(entry.created_at), { locale: ptBR, addSuffix: true });

      return (
        <Card 
          className={`
            group relative flex flex-col h-[200px] overflow-hidden border-border/40 bg-muted/20 
            transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer
            ${entry.is_archived ? "opacity-60 grayscale" : ""}
          `}
          onClick={() => setEntryToRead(entry)}
        >
            {/* 1. ÁREA DA IMAGEM DE CAPA (Fundo) */}
            <div className="absolute inset-0 z-0 bg-muted">
                {coverUrl ? (
                    <img 
                        src={coverUrl} 
                        alt={entry.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    // Fallback se não tiver imagem: Ícone grande suave
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-background">
                        <Book className="w-12 h-12 text-muted-foreground/10 group-hover:text-primary/20 transition-colors" />
                    </div>
                )}
                {/* Gradiente para o texto ficar legível */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* 2. MENU DE AÇÕES (Canto Superior Direito) - Visível no Hover */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md bg-background/80 hover:bg-background backdrop-blur-sm">
                            <MoreVertical className="w-4 h-4 text-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuItem onClick={() => setEntryToRead(entry)}>
                             <Eye className="w-4 h-4 mr-2" /> Ler Entrada
                         </DropdownMenuItem>
                         
                         <Suspense fallback={<DropdownMenuItem disabled>Carregando...</DropdownMenuItem>}>
                             <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} entry={entry} isPlayerNote={!!entry.player_id} characterId={entry.character_id || undefined} npcId={entry.npc_id || undefined}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                             </JournalEntryDialog>
                         </Suspense>

                         <DropdownMenuSeparator />
                         
                         <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, !!entry.is_archived)}>
                            {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                            {entry.is_archived ? "Restaurar" : "Arquivar"}
                         </DropdownMenuItem>

                         {canShare && (
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={entry.folder_id || "none"} onValueChange={val => handleMoveItem(entry.id, val === "none" ? null : val)}>
                                        <DropdownMenuRadioItem value="none">Raiz (Sem Pasta)</DropdownMenuRadioItem>
                                        {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                             </DropdownMenuSub>
                         )}

                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setEntryToDelete(entry)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                         </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 3. ÍCONES DE ESTADO (Canto Superior Esquerdo) */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                 {entry.is_shared && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary-foreground text-[10px] h-5 px-1.5 backdrop-blur-md border border-primary/30 shadow-sm">
                        <Share2 className="w-3 h-3 mr-1" /> Público
                    </Badge>
                 )}
                 {sourceLabel && (
                    <Badge variant="outline" className="bg-black/40 text-white border-white/20 text-[10px] h-5 px-1.5 backdrop-blur-md">
                        {sourceLabel}
                    </Badge>
                 )}
            </div>

            {/* 4. CONTEÚDO DE TEXTO (Rodapé) */}
            <div className="mt-auto relative z-10 p-3 pb-3">
                 <h3 className="font-bold text-base text-white leading-tight line-clamp-2 drop-shadow-md mb-1">
                    {entry.title || "Sem Título"}
                 </h3>
                 <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                    <span className="flex items-center gap-1 opacity-80">
                       {coverUrl ? <ImageIcon className="w-3 h-3" /> : <Book className="w-3 h-3" />}
                       {timeAgo}
                    </span>
                    
                    {/* Botão de Partilha Rápida (só se for permitido) */}
                    {canShare && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ShareDialog itemTitle={entry.title} currentSharedWith={entry.shared_with_players || []} onSave={(ids) => handleUpdateSharing(entry.id, ids)}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                                    <Share2 className="w-3 h-3" />
                                </Button>
                            </ShareDialog>
                        </div>
                    )}
                 </div>
            </div>
        </Card>
      );
  };

  if (isLoadingJournal) return <div className="grid gap-4 grid-cols-2 md:grid-cols-4"><SheetLoadingFallback /><SheetLoadingFallback /><SheetLoadingFallback /><SheetLoadingFallback /></div>;

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
            // Layout de Grade Responsivo para Cartões Menores
            gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
            actions={
                <>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Diário" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal}>
                            <Button size="sm" className="shadow-md"><Plus className="w-4 h-4 mr-2" /> Nova Nota</Button>
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