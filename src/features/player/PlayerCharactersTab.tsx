import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen
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

  // Estados
  const [showArchivedChars, setShowArchivedChars] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterWithRelations | null>(null);
  
  // Estado da Ficha Aberta
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

  // --- HANDLERS ---
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
    <div className="flex flex-col h-full space-y-4">
        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-1">
            <div className="flex items-center gap-2">
                <ManageFoldersDialog tableId={tableId} folders={folders} tableName="character_folders" title="Minhas Pastas" />
                <div className="flex items-center space-x-2 bg-card border px-3 py-1.5 rounded-md shadow-sm">
                    <Switch id="show-archived-p" checked={showArchivedChars} onCheckedChange={setShowArchivedChars} />
                    <Label htmlFor="show-archived-p" className="cursor-pointer text-sm font-medium flex items-center gap-2">
                        {showArchivedChars ? <ArchiveRestore className="w-4 h-4"/> : <Archive className="w-4 h-4"/>}
                        {showArchivedChars ? "Ver Ativos" : "Ver Arquivados"}
                    </Label>
                </div>
            </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 min-h-0">
            <EntityListManager
                title="Minhas Fichas"
                type="character"
                items={displayedChars}
                folders={folders}
                isLoading={isLoadingChars}
                
                // Conecta os eventos para evitar o erro 'is not a function'
                onEdit={(id) => setSelectedCharId(id)}
                onDelete={(id) => {
                    const char = myCharacters.find(c => c.id === id);
                    if (char) setCharacterToDelete(char);
                }}
                onDuplicate={handleDuplicateCharacter}
                onArchive={handleArchiveItem}
                onMove={handleMoveItem}
                
                // Ação de criar
                actions={
                    <CreatePlayerCharacterDialog tableId={tableId} onCharacterCreated={invalidateCharacters}>
                       <Button size="sm" className="h-9 shadow-sm">
                           <Plus className="w-4 h-4 mr-2" /> Nova Ficha
                       </Button>
                   </CreatePlayerCharacterDialog>
                }
            />
        </div>
        
        {/* FICHA */}
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