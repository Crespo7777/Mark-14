import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  LayoutGrid,
  List
} from "lucide-react";
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
import { CreatePlayerCharacterDialog } from "@/components/CreatePlayerCharacterDialog";
import { EntityListManager } from "@/components/EntityListManager";
import { CharacterWithRelations, FolderType } from "@/types/app-types";
import { CharacterSheetSheet } from "@/components/CharacterSheetSheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CharacterCard } from "@/components/CharacterCard";

const fetchPlayerCharacters = async (tableId: string) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
    .eq("table_id", tableId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data as CharacterWithRelations[];
};

const fetchFolders = async (tableId: string) => {
  const { data, error } = await supabase.from("character_folders").select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

export const PlayerCharactersTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchivedChars, setShowArchivedChars] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterWithRelations | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const { data: allCharacters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchPlayerCharacters(tableId),
    enabled: !!userId,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId),
    enabled: !!userId,
  });

  const myCharacters = allCharacters.filter(c => c.player_id === userId);

  const invalidateCharacters = () => queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  const handleArchiveItem = async (id: string, currentValue: boolean) => {
    const { error } = await supabase.from("characters").update({ is_archived: !currentValue }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
        invalidateCharacters();
    }
  };

  const handleMoveItem = async (id: string, folderId: string | null) => {
    const { error } = await supabase.from("characters").update({ folder_id: folderId }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: "Movido com sucesso" });
        invalidateCharacters();
    }
  };

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);
    const { error } = await supabase.from("characters").delete().eq("id", characterToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Ficha excluída!" });
      invalidateCharacters();
      invalidateJournal();
    }
    setCharacterToDelete(null);
  };

  const handleDuplicateCharacter = async (charToDuplicate: any) => {
    const newName = `Cópia de ${charToDuplicate.name}`;
    const { data: fullCharData } = await supabase.from("characters").select("data").eq("id", charToDuplicate.id).single();

    if (!fullCharData) {
      toast({ title: "Erro", description: "Ficha não encontrada.", variant: "destructive" });
      return;
    }

    const newData = JSON.parse(JSON.stringify(fullCharData.data || {}));
    newData.name = newName;

    const { error } = await supabase.from("characters").insert({
      table_id: tableId,
      player_id: userId,
      name: newName,
      data: newData,
      is_shared: false,
      shared_with_players: [],
      folder_id: charToDuplicate.folder_id,
      is_archived: charToDuplicate.is_archived
    });

    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Ficha Duplicada!" });
      invalidateCharacters();
    }
  };

  const displayedChars = myCharacters.filter(char => 
    showArchivedChars ? char.is_archived : !char.is_archived
  );

  return (
    <div className="flex flex-col h-full space-y-4 p-2">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-background/50 p-2 rounded-lg border">
            <div className="flex items-center gap-2">
                <ManageFoldersDialog tableId={tableId} folders={folders} tableName="character_folders" title="Pastas" />
                
                <div className="flex items-center bg-secondary/50 rounded-md p-1 border">
                    <Button 
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setViewMode('grid')}
                        title="Ver em Grade"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setViewMode('list')}
                        title="Ver em Lista"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center space-x-2 px-2 border-l ml-2">
                    <Switch id="show-archived-p" checked={showArchivedChars} onCheckedChange={setShowArchivedChars} />
                    <Label htmlFor="show-archived-p" className="cursor-pointer text-xs font-medium text-muted-foreground">
                        {showArchivedChars ? "Arquivados" : "Ativos"}
                    </Label>
                </div>
            </div>

            <CreatePlayerCharacterDialog tableId={tableId} onCharacterCreated={invalidateCharacters}>
                <Button size="sm" className="h-9 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Nova Ficha
                </Button>
            </CreatePlayerCharacterDialog>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
            {viewMode === 'list' ? (
                <EntityListManager
                    title=""
                    type="character"
                    items={displayedChars}
                    folders={folders}
                    isLoading={isLoadingChars}
                    onEdit={(id) => setSelectedCharId(id)}
                    onDelete={(id) => {
                        const char = myCharacters.find(c => c.id === id);
                        if (char) setCharacterToDelete(char);
                    }}
                    onDuplicate={handleDuplicateCharacter}
                    onArchive={handleArchiveItem}
                    onMove={handleMoveItem}
                    actions={null}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 pb-10">
                    {displayedChars.map(char => (
                        <CharacterCard 
                            key={char.id}
                            character={char}
                            isMaster={false}
                            onEdit={(id) => setSelectedCharId(id)}
                            onDelete={(id) => setCharacterToDelete(char)}
                            onDuplicate={handleDuplicateCharacter}
                            onArchive={handleArchiveItem}
                        />
                    ))}
                    {displayedChars.length === 0 && !isLoadingChars && (
                        <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                            Nenhuma ficha encontrada.
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <CharacterSheetSheet 
          characterId={selectedCharId} 
          open={!!selectedCharId} 
          onOpenChange={(open) => !open && setSelectedCharId(null)} 
        />

        <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle>
                    <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};