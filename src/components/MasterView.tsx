// src/components/MasterView.tsx

import { useEffect, useState, lazy, Suspense } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  Trash2,
  BookOpen,
  Edit,
  UserX,
  Copy,
  MoreVertical,
  Share2,
  Search,
  Archive,
  ArchiveRestore,
  FolderOpen,
  Folder
} from "lucide-react";
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
import { ShareDialog } from "./ShareDialog";
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
import { CreateCharacterDialog } from "./CreateCharacterDialog";

import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JournalRenderer } from "./JournalRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; 
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label"; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; 

import { useTableContext } from "@/features/table/TableContext"; 
import { DiscordSettingsDialog } from "./DiscordSettingsDialog"; 
import { ManageFoldersDialog } from "./ManageFoldersDialog"; 

const JournalEntryDialog = lazy(() =>
  import("./JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);
const CharacterSheetSheet = lazy(() =>
  import("./CharacterSheetSheet").then(module => ({ default: module.CharacterSheetSheet }))
);
const CreateNpcDialog = lazy(() =>
  import("./CreateNpcDialog").then(module => ({ default: module.CreateNpcDialog }))
);
const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </CardHeader>
    <CardContent className="flex-1">
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
    <CardFooter className="flex justify-between items-center">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-8" />
    </CardFooter>
  </Card>
);

// Tipos atualizados com as novas colunas
type Character = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
  folder_id?: string | null;
  is_archived?: boolean;
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"] & {
  folder_id?: string | null;
  is_archived?: boolean;
};
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
  folder_id?: string | null;
  is_archived?: boolean;
};
type FolderType = { id: string; name: string };

// Funções de Fetch
const fetchCharacters = async (tableId: string) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
    .eq("table_id", tableId);
  if (error) throw error;
  return data as Character[];
};

const fetchNpcs = async (tableId: string) => {
  const { data, error } = await supabase.from("npcs").select("*, shared_with_players").eq("table_id", tableId);
  if (error) throw error;
  return data as Npc[];
};

const fetchJournalEntries = async (tableId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)`)
    .eq("table_id", tableId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
};

const fetchFolders = async (tableId: string, table: "npc_folders" | "character_folders" | "journal_folders") => {
  const { data, error } = await supabase.from(table).select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId, masterId }: MasterViewProps) => {
  const { members } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("characters");

  // Estados de Pesquisa e Filtros (Um para cada aba para manter estado independente)
  const [charSearch, setCharSearch] = useState("");
  const [showArchivedChars, setShowArchivedChars] = useState(false);

  const [npcSearch, setNpcSearch] = useState("");
  const [showArchivedNpcs, setShowArchivedNpcs] = useState(false);

  const [journalSearch, setJournalSearch] = useState("");
  const [showArchivedJournal, setShowArchivedJournal] = useState(false);

  // Estados de Ação
  const [playerToRemove, setPlayerToRemove] = useState<any | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [npcToDelete, setNpcToDelete] = useState<Npc | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  // Queries de Dados
  const { data: characters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
    enabled: activeTab === 'characters',
  });
  const { data: charFolders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'character_folders'),
    enabled: activeTab === 'characters',
  });

  const { data: npcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchNpcs(tableId),
    enabled: activeTab === 'npcs',
  });
  const { data: npcFolders = [] } = useQuery({
    queryKey: ['npc_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'npc_folders'),
    enabled: activeTab === 'npcs',
  });

  const { data: journalEntries = [], isLoading: isLoadingJournal } = useQuery({
    queryKey: ['journal', tableId],
    queryFn: () => fetchJournalEntries(tableId),
    enabled: activeTab === 'journal',
  });
  const { data: journalFolders = [] } = useQuery({
    queryKey: ['journal_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'journal_folders'),
    enabled: activeTab === 'journal',
  });
  
  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`master-view-updates:${tableId}`)
      .on("postgres_changes", { event: "*", schema: "public", filter: `table_id=eq.${tableId}` }, (payload) => {
         const table = payload.table;
         if (table === "characters" || table === "character_folders") queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
         if (table === "character_folders") queryClient.invalidateQueries({ queryKey: ['character_folders', tableId] }); // Force folder refresh
         
         if (table === "npcs" || table === "npc_folders") queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
         if (table === "npc_folders") queryClient.invalidateQueries({ queryKey: ['npc_folders', tableId] });

         if (table === "journal_entries" || table === "journal_folders") queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
         if (table === "journal_folders") queryClient.invalidateQueries({ queryKey: ['journal_folders', tableId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableId, queryClient]);

  const invalidateCharacters = () => queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
  const invalidateNpcs = () => queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  // Funções Genéricas de Gestão (Mover e Arquivar)
  const handleArchiveItem = async (id: string, table: string, currentValue: boolean) => {
    const { error } = await supabase.from(table as any).update({ is_archived: !currentValue }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
  };

  const handleMoveItem = async (id: string, table: string, folderId: string | null) => {
    const { error } = await supabase.from(table as any).update({ folder_id: folderId }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Movido com sucesso" });
  };

  // Handlers Específicos (Delete, Duplicate, Share)
  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    const { error } = await supabase.from("table_members").delete().eq("table_id", tableId).eq("user_id", playerToRemove.id);
    if (!error) {
        await supabase.from("characters").delete().eq("table_id", tableId).eq("player_id", playerToRemove.id);
        toast({ title: "Jogador removido" });
        invalidateCharacters();
    }
    setPlayerToRemove(null);
  };

  const handleDeleteNpc = async () => {
    if (!npcToDelete) return;
    await supabase.from("journal_entries").update({ npc_id: null }).eq("npc_id", npcToDelete.id);
    await supabase.from("npcs").delete().eq("id", npcToDelete.id);
    toast({ title: "NPC excluído" });
    invalidateNpcs();
    setNpcToDelete(null);
  };
  
  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    await supabase.from("journal_entries").delete().eq("id", entryToDelete.id);
    toast({ title: "Entrada excluída" });
    invalidateJournal();
    setEntryToDelete(null);
  };
  
  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);
    await supabase.from("characters").delete().eq("id", characterToDelete.id);
    toast({ title: "Ficha excluída" });
    invalidateCharacters();
    setCharacterToDelete(null);
  };

  const handleDuplicateNpc = async (npc: Npc) => {
    setDuplicating(true);
    const newData = JSON.parse(JSON.stringify(npc.data || {}));
    newData.name = `Cópia de ${npc.name}`;
    await supabase.from("npcs").insert({
      table_id: tableId,
      name: newData.name,
      data: newData,
      is_shared: false,
      folder_id: npc.folder_id,
      is_archived: npc.is_archived
    });
    toast({ title: "NPC Duplicado!" });
    invalidateNpcs();
    setDuplicating(false);
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
      folder_id: char.folder_id, // Novo campo
      is_archived: char.is_archived // Novo campo
    });
    toast({ title: "Ficha Duplicada!" });
    invalidateCharacters();
    setDuplicating(false);
  };

  const handleUpdateSharing = async (id: string, table: string, players: string[]) => {
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isShared = allPlayerIds.length > 0 && players.length === allPlayerIds.length;
    await supabase.from(table as any).update({ shared_with_players: players, is_shared: isShared }).eq("id", id);
    toast({ title: "Partilha atualizada" });
    if (table === 'characters') invalidateCharacters();
    if (table === 'npcs') invalidateNpcs();
    if (table === 'journal_entries') invalidateJournal();
  };

  // Lógica de Filtragem e Agrupamento Genérica
  const groupItems = <T extends { id: string, name: string | any, folder_id?: string | null, is_archived?: boolean }>(
    items: T[], 
    folders: FolderType[], 
    search: string, 
    showArchived: boolean,
    nameKey: keyof T = 'name' as keyof T
  ) => {
    const filtered = items.filter(item => {
      const name = (item[nameKey] as string) || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchesArchive = showArchived ? item.is_archived : !item.is_archived;
      return matchesSearch && matchesArchive;
    });

    const inFolders = folders.map(f => ({
      ...f,
      items: filtered.filter(i => i.folder_id === f.id)
    }));
    const noFolder = filtered.filter(i => !i.folder_id);

    return { inFolders, noFolder, total: filtered.length };
  };

  // Preparar Dados para Renderização
  const groupedChars = groupItems(characters, charFolders, charSearch, showArchivedChars);
  const groupedNpcs = groupItems(npcs, npcFolders, npcSearch, showArchivedNpcs);
  // Para o diário, usamos 'title' em vez de 'name'
  const groupedJournal = groupItems(journalEntries, journalFolders, journalSearch, showArchivedJournal, 'title' as any);


  // --- RENDERERS DE CARDS ---
  
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
             <ShareDialog itemTitle={char.name} currentSharedWith={char.shared_with_players || []} onSave={(ids) => handleUpdateSharing(char.id, 'characters', ids)}>
                <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
             </ShareDialog>
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleDuplicateCharacter(char)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchiveItem(char.id, 'characters', !!char.is_archived)}>
                     {char.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                     {char.is_archived ? "Restaurar" : "Arquivar"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={char.folder_id || "none"} onValueChange={val => handleMoveItem(char.id, 'characters', val === "none" ? null : val)}>
                            <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                            {charFolders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
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

  const NpcCard = ({ npc }: { npc: Npc }) => (
    <Suspense key={npc.id} fallback={<SheetLoadingFallback />}>
      <NpcSheetSheet npcId={npc.id}>
        <Card className={`border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col ${npc.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
                {npc.name}
                {npc.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
            </CardTitle>
            <CardDescription>{npc.is_shared ? "Público" : "Privado"}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1"><p className="text-sm text-muted-foreground">Clique para editar</p></CardContent>
          <CardFooter className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
             <ShareDialog itemTitle={npc.name} currentSharedWith={npc.shared_with_players || []} onSave={(ids) => handleUpdateSharing(npc.id, 'npcs', ids)}>
                <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
             </ShareDialog>
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleDuplicateNpc(npc)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleArchiveItem(npc.id, 'npcs', !!npc.is_archived)}>
                     {npc.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                     {npc.is_archived ? "Restaurar" : "Arquivar"}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={npc.folder_id || "none"} onValueChange={val => handleMoveItem(npc.id, 'npcs', val === "none" ? null : val)}>
                            <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                            {npcFolders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setNpcToDelete(npc)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </CardFooter>
        </Card>
      </NpcSheetSheet>
    </Suspense>
  );

  const JournalCard = ({ entry }: { entry: JournalEntry }) => {
     let description = "Anotação do Mestre";
     let canShare = true;
     if (entry.player) { description = `De: ${entry.player.display_name}`; canShare = false; }
     else if (entry.character) { description = `Personagem: ${entry.character.name}`; canShare = false; }
     else if (entry.npc) { description = `NPC: ${entry.npc.name}`; canShare = false; }
     else if (entry.is_shared) { description = "Público"; }
     
     return (
        <Card key={entry.id} className={`border-border/50 flex flex-col ${entry.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
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
                        <ShareDialog itemTitle={entry.title} currentSharedWith={entry.shared_with_players || []} onSave={(ids) => handleUpdateSharing(entry.id, 'journal_entries', ids)}>
                            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Partilhar</Button>
                        </ShareDialog>
                    ) : <div/>}
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, 'journal_entries', !!entry.is_archived)}>
                                {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                                {entry.is_archived ? "Restaurar" : "Arquivar"}
                             </DropdownMenuItem>
                             {/* Só mostrar opção de mover se for Nota Geral (sem links) */}
                             {canShare && (
                                 <DropdownMenuSub>
                                    <DropdownMenuSubTrigger><FolderOpen className="w-4 h-4 mr-2" /> Mover para...</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={entry.folder_id || "none"} onValueChange={val => handleMoveItem(entry.id, 'journal_entries', val === "none" ? null : val)}>
                                            <DropdownMenuRadioItem value="none">Sem Pasta</DropdownMenuRadioItem>
                                            {journalFolders.map(f => <DropdownMenuRadioItem key={f.id} value={f.id}>{f.name}</DropdownMenuRadioItem>)}
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
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2"> 
          <h2 className="text-3xl font-bold">Painel do Mestre</h2>
          <Suspense fallback={<Button variant="outline" size="sm" disabled>Carregando...</Button>}>
            <DiscordSettingsDialog />
          </Suspense>
        </div>
        <p className="text-muted-foreground">Controle total sobre a mesa</p>
      </div>

      <Tabs defaultValue="characters" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="journal">Diário</TabsTrigger>
        </TabsList>
        
        {/* ABA PERSONAGENS */}
        <TabsContent value="characters" className="space-y-4">
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
                    <ManageFoldersDialog tableId={tableId} folders={charFolders} tableName="character_folders" title="Personagens" />
                    <CreateCharacterDialog tableId={tableId} masterId={masterId} members={members} onCharacterCreated={invalidateCharacters}>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ficha</Button>
                    </CreateCharacterDialog>
                 </div>
            </div>

            {isLoadingChars ? <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div> : (
               <div className="space-y-6">
                  {groupedChars.inFolders.length > 0 && (
                     <Accordion type="multiple" className="w-full space-y-2">
                        {groupedChars.inFolders.map(f => (
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
                  {groupedChars.noFolder.length > 0 && (
                     <div>
                        {charFolders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Outros</h4>}
                        <div className="grid gap-4 md:grid-cols-2">{groupedChars.noFolder.map(c => <CharacterCard key={c.id} char={c} />)}</div>
                     </div>
                  )}
                  {groupedChars.total === 0 && <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">Nenhum personagem encontrado.</p>}
               </div>
            )}
          </div>
        </TabsContent>

        {/* ABA NPCS */}
        <TabsContent value="npcs" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar NPC..." value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)} className="h-9" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="show-archived-npcs" checked={showArchivedNpcs} onCheckedChange={setShowArchivedNpcs} />
                        <Label htmlFor="show-archived-npcs" className="text-sm cursor-pointer">Arquivados</Label>
                    </div>
                    <ManageFoldersDialog tableId={tableId} folders={npcFolders} tableName="npc_folders" title="NPCs" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <CreateNpcDialog tableId={tableId} onNpcCreated={invalidateNpcs}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo NPC</Button>
                        </CreateNpcDialog>
                    </Suspense>
                </div>
            </div>

            {isLoadingNpcs ? <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div> : (
               <div className="space-y-6">
                    {groupedNpcs.inFolders.length > 0 && (
                        <Accordion type="multiple" className="w-full space-y-2">
                            {groupedNpcs.inFolders.map(folder => (
                                <AccordionItem key={folder.id} value={folder.id} className="border rounded-lg bg-card px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><span className="font-semibold">{folder.name}</span><span className="text-muted-foreground text-sm ml-2">({folder.items.length})</span></div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4">
                                        <div className="grid gap-4 md:grid-cols-2">{folder.items.map(npc => <NpcCard key={npc.id} npc={npc} />)}</div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                    {groupedNpcs.noFolder.length > 0 && (
                        <div>
                            {npcFolders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Outros</h4>}
                            <div className="grid gap-4 md:grid-cols-2">{groupedNpcs.noFolder.map(npc => <NpcCard key={npc.id} npc={npc} />)}</div>
                        </div>
                    )}
                    {groupedNpcs.total === 0 && <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">Nenhum NPC encontrado.</p>}
               </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
          {members.filter(m => !m.isMaster).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum jogador entrou na sua mesa ainda.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.filter(m => !m.isMaster).map((member) => (
                <Card key={member.id} className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{member.display_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <CardTitle className="text-lg">{member.display_name}</CardTitle>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => setPlayerToRemove(member)}><UserX className="w-4 h-4" /></Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA DIÁRIO */}
        <TabsContent value="journal" className="space-y-4">
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
                    <ManageFoldersDialog tableId={tableId} folders={journalFolders} tableName="journal_folders" title="Diário" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Entrada</Button>
                        </JournalEntryDialog>
                    </Suspense>
                </div>
            </div>

            {isLoadingJournal ? <div className="grid gap-4 md:grid-cols-2"><SheetLoadingFallback /><SheetLoadingFallback /></div> : (
               <div className="space-y-6">
                  {groupedJournal.inFolders.length > 0 && (
                     <Accordion type="multiple" className="w-full space-y-2">
                        {groupedJournal.inFolders.map(f => (
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
                  {groupedJournal.noFolder.length > 0 && (
                     <div>
                        {journalFolders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Outros</h4>}
                        <div className="grid gap-4 md:grid-cols-2">{groupedJournal.noFolder.map(e => <JournalCard key={e.id} entry={e} />)}</div>
                     </div>
                  )}
                  {groupedJournal.total === 0 && <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">Nenhuma entrada encontrada.</p>}
               </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGOS DE EXCLUSÃO */}
      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Jogador?</AlertDialogTitle>
            <AlertDialogDescription>Você tem certeza que quer remover <span className="font-bold text-destructive">{playerToRemove?.display_name}</span>? Todas as fichas deste jogador serão excluídas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePlayer} className={buttonVariants({ variant: "destructive" })}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir esta Entrada?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!npcToDelete} onOpenChange={(open) => !open && setNpcToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir este NPC?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteNpc} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};