// src/components/PlayerView.tsx

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
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Edit, 
  Users, 
  UserSquare, 
  Copy,
  Search,
  Folder,
  MoreVertical,
  Archive,
  ArchiveRestore,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreatePlayerCharacterDialog } from "./CreatePlayerCharacterDialog";
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
import { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalRenderer } from "./JournalRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableContext } from "@/features/table/TableContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ManageFoldersDialog } from "./ManageFoldersDialog";
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

// Lazy loading
const CharacterSheetSheet = lazy(() =>
  import("./CharacterSheetSheet").then(module => ({ default: module.CharacterSheetSheet }))
);
const NpcSheetSheet = lazy(() =>
  import("@/features/npc/NpcSheetSheet").then(module => ({ default: module.NpcSheetSheet }))
);
const JournalEntryDialog = lazy(() =>
  import("./JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

const SheetLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
    <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
  </Card>
);
const NpcLoadingFallback = () => (
  <Card className="border-border/50 flex flex-col">
    <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
    <CardContent className="flex-1"><Skeleton className="h-4 w-3/4" /></CardContent>
  </Card>
);

// Tipos
type MyCharacter = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
  folder_id?: string | null;
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"] & {
  folder_id?: string | null;
};
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
  folder_id?: string | null;
};
type FolderType = { id: string; name: string };

// Fetch Functions
const fetchPlayerCharacters = async (tableId: string) => {
  const { data, error } = await supabase
    .from("characters")
    .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
    .eq("table_id", tableId);
  if (error) throw error;
  return data as MyCharacter[];
};

const fetchPlayerJournal = async (tableId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)`)
    .eq("table_id", tableId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
};

const fetchSharedNpcs = async (tableId: string) => {
  const { data, error } = await supabase.from("npcs").select("*, shared_with_players").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as Npc[];
};

const fetchFolders = async (tableId: string, table: "npc_folders" | "character_folders" | "journal_folders") => {
  const { data, error } = await supabase.from(table).select("*").eq("table_id", tableId).order("name", { ascending: true });
  if (error) throw error;
  return data as FolderType[];
};

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("characters");
  
  // Estados de Pesquisa e Filtro
  const [charSearch, setCharSearch] = useState("");
  const [showArchivedChars, setShowArchivedChars] = useState(false);
  
  const [npcSearch, setNpcSearch] = useState("");
  
  const [journalSearch, setJournalSearch] = useState("");
  const [showArchivedJournal, setShowArchivedJournal] = useState(false);

  const [characterToDelete, setCharacterToDelete] = useState<MyCharacter | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  // Queries
  const { data: allCharacters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchPlayerCharacters(tableId),
    enabled: !!userId && activeTab === 'characters',
  });
  const { data: charFolders = [] } = useQuery({
    queryKey: ['character_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'character_folders'),
    enabled: !!userId && activeTab === 'characters',
  });

  const { data: journalEntries = [], isLoading: isLoadingJournal } = useQuery({
    queryKey: ['journal', tableId],
    queryFn: () => fetchPlayerJournal(tableId),
    enabled: !!userId && activeTab === 'journal',
  });
  const { data: journalFolders = [] } = useQuery({
    queryKey: ['journal_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'journal_folders'),
    enabled: !!userId && activeTab === 'journal',
  });

  const { data: sharedNpcs = [], isLoading: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: () => fetchSharedNpcs(tableId),
    enabled: !!userId && activeTab === 'npcs',
  });
  const { data: npcFolders = [] } = useQuery({
    queryKey: ['npc_folders', tableId],
    queryFn: () => fetchFolders(tableId, 'npc_folders'),
    enabled: !!userId && activeTab === 'npcs',
  });

  // Filtra apenas as fichas que pertencem ao jogador
  const myCharacters = allCharacters.filter(c => c.player_id === userId);

  // Realtime Updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`player-view:${tableId}:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", filter: `table_id=eq.${tableId}` }, (payload) => {
          const table = payload.table;
          if (table === "characters" || table === "character_folders") queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
          if (table === "npcs" || table === "npc_folders") queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
          if (table === "journal_entries" || table === "journal_folders") queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableId, userId, queryClient]);

  const invalidateCharacters = () => queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', tableId] });

  // Ações
  const handleArchiveItem = async (id: string, table: string, currentValue: boolean) => {
    const { error } = await supabase.from(table as any).update({ is_archived: !currentValue }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: !currentValue ? "Arquivado" : "Restaurado" });
    if (table === 'characters') invalidateCharacters();
    if (table === 'journal_entries') invalidateJournal();
  };

  const handleMoveItem = async (id: string, table: string, folderId: string | null) => {
    const { error } = await supabase.from(table as any).update({ folder_id: folderId }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Movido com sucesso" });
    if (table === 'characters') invalidateCharacters();
    if (table === 'journal_entries') invalidateJournal();
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

  const handleDuplicateCharacter = async (charToDuplicate: MyCharacter) => {
    setDuplicating(true);
    if (!userId) { setDuplicating(false); return; };
    
    const newName = `Cópia de ${charToDuplicate.name}`;
    const { data: fullCharData } = await supabase.from("characters").select("data").eq("id", charToDuplicate.id).single();

    if (!fullCharData) {
      toast({ title: "Erro", description: "Ficha não encontrada.", variant: "destructive" });
      setDuplicating(false);
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
    setDuplicating(false);
  };

  // Lógica de Agrupamento
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
      // Se showArchived for true, mostramos apenas os arquivados. Se false, mostramos os não arquivados.
      // Ou queres que showArchived mostre TUDO? Geralmente é um toggle para ver o "lixo".
      // Vamos assumir: Toggle ON = Ver Arquivados. Toggle OFF = Ver Ativos.
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

  // Preparar dados
  const groupedChars = groupItems(myCharacters, charFolders, charSearch, showArchivedChars);
  const groupedNpcs = groupItems(sharedNpcs, npcFolders, npcSearch, false); // NPCs partilhados não mostram arquivados para o player (geralmente)
  const groupedJournal = groupItems(journalEntries.filter(e => {
     // Filtro complexo do diário para garantir que é visível
     const isSharedWithMe = (e.shared_with_players || []).includes(userId!);
     return e.player_id === userId || (e.character && myCharacters.some(c => c.id === e.character_id)) || isSharedWithMe || e.is_shared;
  }), journalFolders, journalSearch, showArchivedJournal, 'title' as any);


  // --- RENDERERS ---

  const CharacterCard = ({ char }: { char: MyCharacter }) => (
    <Suspense key={char.id} fallback={<SheetLoadingFallback />}>
      <CharacterSheetSheet characterId={char.id}>
        <Card className={`border-border/50 flex flex-col justify-between h-full ${char.is_archived ? "opacity-60 bg-muted/20" : ""}`}>
          <div className="flex-1 hover:shadow-glow transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                {char.name}
                {char.is_archived && <span className="text-xs bg-muted px-2 py-1 rounded">Arquivado</span>}
              </CardTitle>
              <CardDescription>Sua Ficha</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Clique para editar</p></CardContent>
          </div>
          <CardFooter className="p-4 pt-0 flex justify-between items-center" onClick={e => e.stopPropagation()}>
            <Button variant="outline" size="sm" disabled={duplicating} onClick={() => handleDuplicateCharacter(char)}>
              <Copy className="w-4 h-4 mr-2" /> Duplicar
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent onClick={e => e.stopPropagation()}>
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
    <Suspense key={npc.id} fallback={<NpcLoadingFallback />}>
      <NpcSheetSheet npcId={npc.id}>
        <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> {npc.name}</CardTitle>
            <CardDescription>NPC compartilhado</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Clique para ver</p></CardContent>
        </Card>
      </NpcSheetSheet>
    </Suspense>
  );

  const JournalCard = ({ entry }: { entry: JournalEntry }) => {
    let description = "Anotação Pública";
    let isMyEntry = false;
    if (!userId) return null;
    const isSharedWithMe = (entry.shared_with_players || []).includes(userId);
    
    if (entry.player_id === userId) { description = "Sua Anotação"; isMyEntry = true; } 
    else if (entry.character) { if(myCharacters.some(c => c.id === entry.character_id)) { description = `Diário: ${entry.character.name}`; isMyEntry = true; } } 
    else if (isSharedWithMe) { description = "Partilhado com você"; }

    const canEdit = isMyEntry || isSharedWithMe;

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
        
        {canEdit && (
          <CardFooter className="flex justify-end items-center gap-2">
             {isMyEntry && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                         <DropdownMenuItem onClick={() => handleArchiveItem(entry.id, 'journal_entries', !!entry.is_archived)}>
                            {entry.is_archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                            {entry.is_archived ? "Restaurar" : "Arquivar"}
                         </DropdownMenuItem>
                         {/* Mover para pasta (Só se for nota genérica do jogador, não ligada a char) */}
                         {!!entry.player_id && (
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

      <Tabs defaultValue="characters" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="characters"><UserSquare className="w-4 h-4 mr-2" /> Minhas Fichas</TabsTrigger>
          <TabsTrigger value="npcs"><Users className="w-4 h-4 mr-2" /> NPCs Compartilhados</TabsTrigger>
          <TabsTrigger value="journal"><BookOpen className="w-4 h-4 mr-2" /> Diário & Anotações</TabsTrigger>
        </TabsList>

        {/* ABA PERSONAGENS */}
        <TabsContent value="characters" className="space-y-4">
          <div className="flex flex-col gap-4">
             <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                 <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar Ficha..." value={charSearch} onChange={(e) => setCharSearch(e.target.value)} className="h-9" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="show-archived-chars" checked={showArchivedChars} onCheckedChange={setShowArchivedChars} />
                        <Label htmlFor="show-archived-chars" className="text-sm cursor-pointer">Arquivados</Label>
                    </div>
                    <ManageFoldersDialog tableId={tableId} folders={charFolders} tableName="character_folders" title="Minhas Pastas" />
                    <CreatePlayerCharacterDialog tableId={tableId} onCharacterCreated={invalidateCharacters}>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Ficha</Button>
                    </CreatePlayerCharacterDialog>
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
                       <div className="grid gap-4 md:grid-cols-2">{groupedChars.noFolder.map(c => <CharacterCard key={c.id} char={c} />)}</div>
                    )}
                    {groupedChars.total === 0 && <p className="text-muted-foreground text-center py-12">Nenhum personagem encontrado.</p>}
                </div>
             )}
          </div>
        </TabsContent>

        {/* ABA NPCs */}
        <TabsContent value="npcs" className="space-y-4">
           <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                 <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar NPC..." value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)} className="h-9" />
                 </div>
             </div>

             {isLoadingNpcs ? <div className="grid gap-4 md:grid-cols-2"><NpcLoadingFallback /><NpcLoadingFallback /></div> : (
                <div className="space-y-6">
                   {/* Para NPCs, usamos as pastas do Mestre (npcFolders), mas só mostramos os NPCs partilhados que o player vê */}
                   {groupedNpcs.inFolders.length > 0 && (
                       <Accordion type="multiple" className="w-full space-y-2">
                          {groupedNpcs.inFolders.map(f => (
                             // Só mostrar a pasta se tiver NPCs visíveis dentro
                             f.items.length > 0 && (
                               <AccordionItem key={f.id} value={f.id} className="border rounded-lg bg-card px-4">
                                  <AccordionTrigger className="hover:no-underline py-3">
                                     <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><span className="font-semibold">{f.name}</span><span className="text-muted-foreground text-sm ml-2">({f.items.length})</span></div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-2 pb-4">
                                     <div className="grid gap-4 md:grid-cols-2">{f.items.map(n => <NpcCard key={n.id} npc={n} />)}</div>
                                  </AccordionContent>
                               </AccordionItem>
                             )
                          ))}
                       </Accordion>
                   )}
                   {groupedNpcs.noFolder.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2">{groupedNpcs.noFolder.map(n => <NpcCard key={n.id} npc={n} />)}</div>
                   )}
                   {groupedNpcs.total === 0 && <p className="text-muted-foreground text-center py-12">Nenhum NPC partilhado.</p>}
                </div>
             )}
           </div>
        </TabsContent>

        {/* ABA DIÁRIO */}
        <TabsContent value="journal" className="space-y-4">
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
                    <ManageFoldersDialog tableId={tableId} folders={journalFolders} tableName="journal_folders" title="Minhas Pastas" />
                    <Suspense fallback={<Button size="sm" disabled>...</Button>}>
                        <JournalEntryDialog tableId={tableId} onEntrySaved={invalidateJournal} isPlayerNote={true}>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Anotação</Button>
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
                       <div className="grid gap-4 md:grid-cols-2">{groupedJournal.noFolder.map(e => <JournalCard key={e.id} entry={e} />)}</div>
                    )}
                    {groupedJournal.total === 0 && <p className="text-muted-foreground text-center py-12">Nenhuma anotação encontrada.</p>}
                </div>
             )}
           </div>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGOS DE EXCLUSÃO */}
      <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCharacter} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};