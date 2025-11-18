// src/features/master/MasterCharactersTab.tsx

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
  Copy,
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
import { useTableContext } from "@/features/table/TableContext";
import { CreateCharacterDialog } from "@/components/CreateCharacterDialog";

const CharacterSheetSheet = lazy(() =>
  import("@/components/CharacterSheetSheet").then(module => ({ default: module.CharacterSheetSheet }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
    <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
  </Card>
);

type Character = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
  folder_id?: string | null;
  is_archived?: boolean;
};
type FolderType = { id: string; name: string };

const fetchCharacters = async (tableId: string) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
    .eq("table_id", tableId);
  if (error) throw error;
  return data as Character[];
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
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  const { data: characters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId),
  });

  const invalidateCharacters = () => queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);
    const { error } = await supabase.from("characters").delete().eq("id", characterToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Ficha excluída" });
      invalidateCharacters();
      invalidateJournal();
      setCharacterToDelete(null);
    }
  };

  const handleDuplicateCharacter = async (char: Character) => {
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

  const charsInFolders = folders.map(f => ({
    ...f,
    items: filteredChars.filter(c => c.folder_id === f.id)
  }));
  const charsNoFolder = filteredChars.filter(c => !c.folder_id);

  const CharacterCard = ({ char }: { char: Character }) => (
    <Suspense key={char.id} fallback={<SheetLoadingFallback />}>
      <CharacterSheetSheet characterId={char.id}>
        <Card className={`border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col ${char.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
                {char.name}
                {char.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
            </CardTitle>
            <CardDescription>Jogador: {char.player?.display_name}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1"><p className="text-sm text-muted-foreground">Clique para editar</p></CardContent>
          <CardFooter className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
             <ShareDialog itemTitle={char.name} currentSharedWith={char.shared_with_players || []} disabled={duplicating} onSave={(ids) => handleUpdateSharing(char.id, ids)}>
                <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
             </ShareDialog>
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent onClick={e => e.stopPropagation()}>
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
      </CharacterSheetSheet>
    </Suspense>
  );

  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                 <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar Personagem..." value={charSearch} onChange={(e) => setCharSearch(e.target.value)} className="h-9" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="show-archived-chars" checked={showArchivedChars} onCheckedChange={setShowArchivedChars} />
                        <Label htmlFor="show-archived-chars" className="text-sm cursor-pointer">Arquivados</Label>
                    </div>
                    <ManageFoldersDialog tableId={tableId} folders={folders} tableName="character_folders" title="Personagens" />
                    <CreateCharacterDialog tableId={tableId} masterId={masterId} members={members} onCharacterCreated={invalidateCharacters}>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ficha</Button>
                    </CreateCharacterDialog>
                 </div>
            </div>

            {isLoadingChars ? <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div> : (
               <div className="space-y-6">
                  {charsInFolders.length > 0 && (
                     <Accordion type="multiple" className="w-full space-y-2">
                        {charsInFolders.map(f => (
                           <AccordionItem key={f.id} value={f.id} className="border rounded-lg bg-card px-4">
                              <AccordionTrigger className="hover:no-underline py-3">
                                 <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><span className="font-semibold">{f.name}</span><span className="text-muted-foreground text-sm ml-2">({f.items.length})</span></div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 pb-4">
                                 <div className="grid gap-4 md:grid-cols-2">{f.items.map(c => <CharacterCard key={c.id} char={c} />)}</div>
                              </AccordionContent>
                           </AccordionItem>
                        ))}
                     </Accordion>
                  )}
                  {charsNoFolder.length > 0 && (
                     <div>
                        {folders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Outros</h4>}
                        <div className="grid gap-4 md:grid-cols-2">{charsNoFolder.map(c => <CharacterCard key={c.id} char={c} />)}</div>
                     </div>
                  )}
                  {filteredChars.length === 0 && <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">Nenhum personagem encontrado.</p>}
               </div>
            )}
        </div>

        <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};