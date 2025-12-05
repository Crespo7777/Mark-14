import { useState } from "react";
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
import { useTableContext } from "@/features/table/TableContext";
import { CreateCharacterDialog } from "@/components/CreateCharacterDialog";
import { EntityListManager } from "@/components/EntityListManager";
import { CharacterWithRelations, FolderType } from "@/types/app-types";
import { CharacterSheetSheet } from "@/components/CharacterSheetSheet";
import { ShareDialog } from "@/components/ShareDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const fetchCharacters = async (tableId: string) => {
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

export const MasterCharactersTab = ({ tableId }: { tableId: string }) => {
  const { members, masterId, isMaster, isHelper, userId } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showArchivedChars, setShowArchivedChars] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterWithRelations | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [itemToShare, setItemToShare] = useState<CharacterWithRelations | null>(null);

  const { data: characters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId),
    staleTime: 1000 * 60 * 10,
  });

  const invalidateCharacters = () => queryClient.invalidateQueries({ queryKey: ['characters', tableId] });

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);
    const { error } = await supabase.from("characters").delete().eq("id", characterToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Ficha excluída" });
      invalidateCharacters();
      setCharacterToDelete(null);
    }
  };

  const handleDuplicate = async (char: any) => {
    const newData = JSON.parse(JSON.stringify(char.data || {}));
    newData.name = `Cópia de ${char.name}`;
    await supabase.from("characters").insert({
      table_id: tableId,
      player_id: char.player_id,
      name: newData.name,
      data: newData,
      is_shared: false,
      shared_with_players: [],
      folder_id: char.folder_id,
      is_archived: char.is_archived
    });
    toast({ title: "Ficha Duplicada!" });
    invalidateCharacters();
  };

  const handleArchive = async (id: string, currentValue: boolean) => {
    await supabase.from("characters").update({ is_archived: !currentValue }).eq("id", id);
    toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
    invalidateCharacters();
  };

  const handleMove = async (id: string, folderId: string | null) => {
    await supabase.from("characters").update({ folder_id: folderId }).eq("id", id);
    toast({ title: "Movido com sucesso" });
    invalidateCharacters();
  };

  const handleUpdateSharing = async (ids: string[]) => {
    if(!itemToShare) return;
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && ids.length === allPlayerIds.length;
    await supabase.from("characters").update({ shared_with_players: ids, is_shared: isShared }).eq("id", itemToShare.id);
    toast({ title: "Partilha atualizada" });
    invalidateCharacters();
    setItemToShare(null);
  };

  const displayedCharacters = characters
    .filter(char => showArchivedChars ? char.is_archived : !char.is_archived)
    .filter(char => {
      if (isMaster) return true;
      if (isHelper) {
         const isOwner = char.player_id === userId;
         const isSharedWithMe = char.shared_with_players?.includes(userId || '');
         const isGloballyShared = char.is_shared;
         return isOwner || isSharedWithMe || isGloballyShared;
      }
      return false; 
    });

  return (
    <div className="flex flex-col h-full space-y-4 p-2">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background/50 p-2 rounded-lg border">
        <div className="flex items-center gap-2">
            <ManageFoldersDialog tableId={tableId} folders={folders} tableName="character_folders" title="Pastas" />
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-secondary/50 rounded-md border">
                <Switch id="show-archived" checked={showArchivedChars} onCheckedChange={setShowArchivedChars} />
                <Label htmlFor="show-archived" className="cursor-pointer text-xs font-medium flex items-center gap-1 text-muted-foreground">
                    {showArchivedChars ? <ArchiveRestore className="w-3 h-3"/> : <Archive className="w-3 h-3"/>}
                    {showArchivedChars ? "Arquivados" : "Ativos"}
                </Label>
            </div>
        </div>

        <CreateCharacterDialog 
            tableId={tableId} 
            masterId={masterId} 
            members={members} 
            onCharacterCreated={invalidateCharacters}
        >
            <Button size="sm" className="h-9 shadow-sm gap-1">
                <Plus className="h-4 w-4" /> Novo Personagem
            </Button>
        </CreateCharacterDialog>
      </div>

      <div className="flex-1 min-h-0">
         <EntityListManager
            title="" 
            type="character"
            items={displayedCharacters}
            folders={folders}
            isLoading={isLoadingChars}
            onEdit={(id) => setSelectedCharId(id)}
            onDelete={(id) => {
                const char = characters.find(c => c.id === id);
                if (char) setCharacterToDelete(char);
            }}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onMove={handleMove}
            onShare={(item) => setItemToShare(item)}
            actions={null} 
         />
      </div>

      <CharacterSheetSheet 
        characterId={selectedCharId} 
        open={!!selectedCharId} 
        onOpenChange={(open) => !open && setSelectedCharId(null)} 
      />

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

      <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {characterToDelete?.name}?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>
                    <Trash2 className="w-4 h-4 mr-2"/> Excluir
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};