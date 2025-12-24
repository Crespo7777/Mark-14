import { useState, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
    Plus, Edit, Trash2, Eye, FolderOpen, Archive, ArchiveRestore, 
    MoreVertical, Share2, Image as ImageIcon, Book, Loader2
} from "lucide-react"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { JournalReadDialog } from "@/components/JournalReadDialog";
import { JournalEntryWithRelations, FolderType } from "@/types/app-types";
import { EntityListManager } from "@/components/EntityListManager"; 
import { Card } from "@/components/ui/card"; 
import { ManageFoldersDialog } from "@/components/ManageFoldersDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

interface SharedEntityJournalTabProps {
  entityId: string;
  entityType: "character" | "npc";
  tableId: string;
  isReadOnly?: boolean;
}

// --- OTIMIZAÇÃO: Select específico SEM 'content' ---
const fetchEntityJournal = async (entityId: string, type: "character" | "npc") => {
  const column = type === "character" ? "character_id" : "npc_id";
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
      table_id,
      player_id,
      character_id,
      npc_id,
      shared_with_players,
      player:profiles!journal_entries_player_id_fkey(display_name), 
      character:characters!journal_entries_character_id_fkey(name), 
      npc:npcs!journal_entries_npc_id_fkey(name)
    `) // 'content' removido para performance
    .eq(column, entityId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as JournalEntryWithRelations[];
};

const fetchFolders = async (tableId: string) => {
    const { data, error } = await supabase.from("journal_folders").select("*").eq("table_id", tableId).order("name", { ascending: true });
    if (error) throw error;
    return data as FolderType[];
};

export const SharedEntityJournalTab = ({ entityId, entityType, tableId, isReadOnly = false }: SharedEntityJournalTabProps) => { 
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntryWithRelations | null>(null);
  const [entryToRead, setEntryToRead] = useState<JournalEntryWithRelations | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntryWithRelations | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal_entries", entityType, entityId],
    queryFn: () => fetchEntityJournal(entityId, entityType),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['journal_folders', tableId],
    queryFn: () => fetchFolders(tableId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["journal_entries", entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
  };

  // --- NOVA FUNÇÃO: Busca conteúdo sob demanda ---
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

  const handleDelete = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Anotação excluída" });
      invalidate();
    }
    setEntryToDelete(null);
  };

  const handleArchive = async (id: string, currentVal: boolean) => {
      await supabase.from("journal_entries").update({ is_archived: !currentVal }).eq("id", id);
      invalidate();
      toast({ title: currentVal ? "Restaurado" : "Arquivado" });
  };

  const handleMoveFolder = async (id: string, folderId: string | null) => {
      await supabase.from("journal_entries").update({ folder_id: folderId }).eq("id", id);
      invalidate();
      toast({ title: "Movido com sucesso" });
  };

  const filteredEntries = entries.filter(e => {
      if (e.is_hidden_on_sheet) return false;
      const matchSearch = (e.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchArchive = showArchived ? e.is_archived : !e.is_archived;
      return matchSearch && matchArchive;
  });

  // --- RENDER ITEM ---
  const renderItem = (entry: JournalEntryWithRelations) => {
    const coverUrl = entry.data?.cover_image;
    let timeAgo = "Data desconhecida";
    try {
        if(entry.created_at) timeAgo = formatDistanceToNow(new Date(entry.created_at), { locale: ptBR, addSuffix: true });
    } catch(e) { console.error(e) }
    
    const isLoadingThis = isLoadingContent === entry.id;

    return (
        <Card 
            className={`
                group relative flex flex-col h-[200px] overflow-hidden border-border/40 bg-muted/20 
                transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer
                ${entry.is_archived ? "opacity-60 grayscale border-dashed" : ""}
            `}
            onClick={() => !isLoadingThis && handleReadEntry(entry, 'read')}
        >
            {/* 1. IMAGEM DE FUNDO (Capa) */}
            <div className="absolute inset-0 z-0 bg-muted">
                {coverUrl ? (
                    <img 
                        src={coverUrl} 
                        alt={entry.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-background">
                        <Book className="w-12 h-12 text-muted-foreground/10 group-hover:text-primary/20 transition-colors" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Spinner */}
            {isLoadingThis && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {/* 2. MENU DE AÇÕES */}
            {!isReadOnly && (
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md bg-background/80 hover:bg-background backdrop-blur-sm">
                                <MoreVertical className="w-4 h-4 text-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleReadEntry(entry, 'read')}>
                                <Eye className="w-4 h-4 mr-2"/> Ler
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleReadEntry(entry, 'edit')}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2"/> Pasta</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={entry.folder_id || "none"} onValueChange={(val) => handleMoveFolder(entry.id, val === "none" ? null : val)}>
                                        <DropdownMenuRadioItem value="none">Raiz</DropdownMenuRadioItem>
                                        {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleArchive(entry.id, !!entry.is_archived)}>
                                {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2"/> : <Archive className="w-4 h-4 mr-2"/>}
                                {entry.is_archived ? "Restaurar" : "Arquivar"}
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-destructive" onClick={() => setEntryToDelete(entry)}>
                                <Trash2 className="w-4 h-4 mr-2"/> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* 3. BADGES */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                 {entry.is_shared && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary-foreground text-[10px] h-5 px-1.5 backdrop-blur-md border border-primary/30 shadow-sm">
                        <Share2 className="w-3 h-3 mr-1" /> Público
                    </Badge>
                 )}
            </div>

            {/* 4. CONTEÚDO (RODAPÉ) */}
            <div className="mt-auto relative z-10 p-3 pb-3">
                 <h3 className="font-bold text-base text-white leading-tight line-clamp-2 drop-shadow-md mb-1">
                    {entry.title || "Sem Título"}
                 </h3>
                 <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
                    <span className="flex items-center gap-1 opacity-80">
                       {coverUrl ? <ImageIcon className="w-3 h-3" /> : <Book className="w-3 h-3" />}
                       {timeAgo}
                    </span>
                 </div>
            </div>
        </Card>
    );
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div>;

  return (
    <div className="space-y-4 h-full flex flex-col animate-in fade-in">
       <EntityListManager
            items={filteredEntries}
            folders={folders}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            showArchived={showArchived}
            onToggleArchived={setShowArchived}
            renderItem={renderItem}
            emptyMessage={showArchived ? "Nenhum diário arquivado." : "Nenhuma anotação nesta ficha."}
            gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            actions={
                !isReadOnly && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className={showArchived ? "bg-accent text-accent-foreground border border-border" : "text-muted-foreground hover:text-foreground"}
                            title={showArchived ? "Voltar aos Ativos" : "Ver Arquivados"}
                        >
                            {showArchived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                            <span className="hidden sm:inline">{showArchived ? "Restaurar" : "Arquivados"}</span>
                        </Button>
                        
                        <div className="h-4 w-px bg-border mx-1" />

                        <ManageFoldersDialog tableId={tableId} folders={folders} tableName="journal_folders" title="Pastas" />
                        
                        <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                            <JournalEntryDialog
                                tableId={tableId}
                                onEntrySaved={invalidate}
                                characterId={entityType === "character" ? entityId : undefined}
                                npcId={entityType === "npc" ? entityId : undefined}
                            >
                                <Button size="sm" className="shadow-sm">
                                    <Plus className="w-4 h-4 mr-2" /> Nova Nota
                                </Button>
                            </JournalEntryDialog>
                        </Suspense>
                    </>
                )
            }
       />

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a nota permanentemente da ficha e do diário geral.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JournalReadDialog open={!!entryToRead} onOpenChange={(open) => !open && setEntryToRead(null)} entry={entryToRead} />

      // ... no final do arquivo SharedEntityJournalTab.tsx
      {/* Diálogo de Edição agora CONTROLADO pelo estado do pai */}
      {entryToEdit && (
        <Suspense fallback={null}>
          <JournalEntryDialog
             tableId={tableId}
             onEntrySaved={invalidate}
             entry={entryToEdit}
             open={!!entryToEdit} // ABRE AUTOMATICAMENTE QUANDO EXISTE UM ITEM
             onOpenChange={(open) => !open && setEntryToEdit(null)} // LIMPA AO FECHAR
             characterId={entityType === "character" ? entityId : undefined}
            npcId={entityType === "npc" ? entityId : undefined}
      />
    </Suspense>
   )}
    </div>
  );
};