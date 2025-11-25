// src/features/master/MasterCharactersTab.tsx

import { useState } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button"; // <--- IMPORT CORRIGIDO
import {
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Share2,
  Plus
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
import { useTableContext } from "@/features/table/TableContext";
import { CreateCharacterDialog } from "@/components/CreateCharacterDialog";
import { EntityListManager } from "@/components/EntityListManager";
import { CharacterWithRelations, FolderType } from "@/types/app-types";
import { CharacterSheetSheet } from "@/components/CharacterSheetSheet"; // Importação direta

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col h-[200px]">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

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
  const { members, masterId } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [charSearch, setCharSearch] = useState("");
  const [showArchivedChars, setShowArchivedChars] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterWithRelations | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  
  // ESTADO DA FICHA ABERTA (Controlado Externamente)
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const { data: characters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
    placeholderData: (previousData) => previousData,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId),
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

  const handleDuplicateCharacter = async (char: CharacterWithRelations) => {
    setDuplicating(true);
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
    setDuplicating(false);
  };

  const handleArchiveItem = async (id: string, currentValue: boolean) => {
    await supabase.from("characters").update({ is_archived: !currentValue }).eq("id", id);
    toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
    invalidateCharacters();
  };

  const handleMoveItem = async (id: string, folderId: string | null) => {
    await supabase.from("characters").update({ folder_id: folderId }).eq("id", id);
    toast({ title: "Movido com sucesso" });
    invalidateCharacters();
  };

  const handleUpdateSharing = async (id: string, players: string[]) => {
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && players.length === allPlayerIds.length;
    await supabase.from("characters").update({ shared_with_players: players, is_shared: isShared }).eq("id", id);
    toast({ title: "Partilha atualizada" });
    invalidateCharacters();
  };

  const filteredChars = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(charSearch.toLowerCase());
    const matchesArchive = showArchivedChars ? char.is_archived : !char.is_archived;
    return matchesSearch && matchesArchive;
  });

  // RENDERIZADOR APENAS DO CARTÃO (Sem envolver em Sheet)
  const renderCharacterCard = (char: CharacterWithRelations) => (
    <Card 
      key={char.id}
      className={`border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col ${char.is_archived ? "opacity-60 bg-muted/20" : ""}`}
      onClick={() => setSelectedCharId(char.id)} // <--- ABRE A FICHA AQUI
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-start text-lg">
            {char.name}
            {char.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
        </CardTitle>
        <CardDescription>Jogador: {char.player?.display_name}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1"><p className="text-sm text-muted-foreground">Clique para editar</p></CardContent>
      <CardFooter className="flex justify-between items-center pt-0 pb-4 px-4" onClick={e => e.stopPropagation()}>
          <ShareDialog itemTitle={char.name} currentSharedWith={char.shared_with_players || []} disabled={duplicating} onSave={(ids) => handleUpdateSharing(char.id, ids)}>
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
          </ShareDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => handleDuplicateCharacter(char)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchiveItem(char.id, !!char.is_archived)}>
                  {char.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                  {char.is_archived ? "Restaurar" : "Arquivar"}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={char.folder_id || "none"} onValueChange={val => handleMoveItem(char.id, val === "none" ? null : val)}>
                        <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                        {folders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setCharacterToDelete(char)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </CardFooter>
    </Card>
  );

  if (isLoadingChars && characters.length === 0) return <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div>;

  return (
    <>
      <EntityListManager
        items={filteredChars}
        folders={folders}
        searchTerm={charSearch}
        onSearch={setCharSearch}
        showArchived={showArchivedChars}
        onToggleArchived={setShowArchivedChars}
        renderItem={renderCharacterCard}
        emptyMessage="Nenhum personagem encontrado."
        actions={
          <>
            <ManageFoldersDialog tableId={tableId} folders={folders} tableName="character_folders" title="Personagens" />
            <CreateCharacterDialog tableId={tableId} masterId={masterId} members={members} onCharacterCreated={invalidateCharacters}>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ficha</Button>
            </CreateCharacterDialog>
          </>
        }
      />

      {/* A FICHA VIVE AQUI FORA AGORA */}
      <CharacterSheetSheet 
        characterId={selectedCharId} 
        open={!!selectedCharId} 
        onOpenChange={(open) => !open && setSelectedCharId(null)} 
      />

      <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
};