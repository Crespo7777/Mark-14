// src/components/PlayerView.tsx

import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Trash2, BookOpen, Edit, Users, UserSquare, Copy } from "lucide-react";
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

// Fallbacks de Loading
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


interface PlayerViewProps {
  tableId: string;
}

// Tipos
type MyCharacter = {
  id: string;
  name: string;
  created_at: string;
  player: {
    display_name: string;
  };
  player_id: string;
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"];
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
};


export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const { userId } = useTableContext(); 
  const { toast } = useToast();
  const [characterToDelete, setCharacterToDelete] = useState<MyCharacter | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [sharedNpcs, setSharedNpcs] = useState<Npc[]>([]);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (userId) { 
      loadData();
    }
  
    const channel = supabase
      .channel(`player-view:${tableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        (payload) => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entries", filter: `table_id=eq.${tableId}` },
        (payload) => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => loadData()
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, userId]); 

  const loadData = async () => {
    if (!userId) return; 

    try {
      const [charsRes, journalRes, npcsRes] = await Promise.all([
        supabase
          .from("characters")
          .select("*, player:profiles!characters_player_id_fkey(display_name)")
          .eq("table_id", tableId),

        supabase
          .from("journal_entries")
          .select(`
            *,
            player:profiles!journal_entries_player_id_fkey(display_name),
            character:characters!journal_entries_character_id_fkey(name),
            npc:npcs!journal_entries_npc_id_fkey(name)
          `)
          .eq("table_id", tableId)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("npcs")
          .select("*")
          .eq("table_id", tableId)
          .order("name", { ascending: true }),
      ]);

      if (charsRes.error) throw charsRes.error;
      const allChars = (charsRes.data as any) || [];
      setMyCharacters(allChars.filter((c: MyCharacter) => c.player_id === userId));

      if (journalRes.error) throw journalRes.error;
      setJournalEntries((journalRes.data as any) || []);

      if (npcsRes.error) throw npcsRes.error;
      setSharedNpcs(npcsRes.data || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados do jogador:", error.message);
      toast({
        title: "Erro ao carregar dados",
        description: "Houve um problema ao buscar seus dados.",
        variant: "destructive",
      });
      setMyCharacters([]);
      setJournalEntries([]);
      setSharedNpcs([]);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    
    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterToDelete.id);
    if (error) {
      toast({ title: "Erro ao excluir ficha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficha excluída!", description: `A ficha ${characterToDelete.name} foi removida.` });
      loadData();
    }
    setCharacterToDelete(null);
  };

  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryToDelete.id);

    if (error) {
      toast({ title: "Erro ao excluir anotação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anotação excluída" });
      setEntryToDelete(null);
      loadData();
    }
  };
  
  const handleDuplicateCharacter = async (charToDuplicate: MyCharacter) => {
    if (!userId) return; 
    setDuplicating(true);

    const newName = `Cópia de ${charToDuplicate.name}`;
    
    const { data: fullCharData, error: fetchError } = await supabase
      .from("characters")
      .select("data")
      .eq("id", charToDuplicate.id)
      .single();

    if (fetchError || !fullCharData) {
      toast({ title: "Erro ao carregar dados", description: fetchError?.message || "Ficha não encontrada.", variant: "destructive" });
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
    });

    if (error) {
      toast({ title: "Erro ao duplicar Ficha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficha Duplicada!", description: `${newName} foi criada.` });
      loadData();
    }
    setDuplicating(false);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">
          Gerencie suas fichas de personagem e anotações
        </p>
      </div>

      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="characters">
             <UserSquare className="w-4 h-4 mr-2" />
             Minhas Fichas
          </TabsTrigger>
          <TabsTrigger value="npcs">
             <Users className="w-4 h-4 mr-2" />
             NPCs Compartilhados
          </TabsTrigger>
          <TabsTrigger value="journal">
            <BookOpen className="w-4 h-4 mr-2" />
            Diário & Anotações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Minhas Fichas</h3>
            <CreatePlayerCharacterDialog
              tableId={tableId}
              onCharacterCreated={loadData}
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </CreatePlayerCharacterDialog>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {myCharacters.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Você ainda não criou nenhum personagem. Clique em "Nova Ficha"
                para começar.
              </p>
            ) : (
              myCharacters.map((char) => (
                <Suspense key={char.id} fallback={<SheetLoadingFallback />}>
                  <CharacterSheetSheet characterId={char.id}>
                    <Card className="border-border/50 flex flex-col justify-between h-full">
                      <div className="flex-1 hover:shadow-glow transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle>{char.name}</CardTitle>
                          <CardDescription>Sua Ficha</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Clique para editar
                          </p>
                        </CardContent>
                      </div>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={duplicating}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateCharacter(char);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          disabled={duplicating}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCharacterToDelete(char);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Ficha
                        </Button>
                      </CardFooter>
                    </Card>
                  </CharacterSheetSheet>
                </Suspense>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="npcs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">NPCs Compartilhados</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sharedNpcs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                O Mestre ainda não compartilhou nenhum NPC.
              </p>
            ) : (
              sharedNpcs.map((npc) => (
                <Suspense key={npc.id} fallback={<NpcLoadingFallback />}>
                  <NpcSheetSheet npcId={npc.id}>
                    <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" /> {npc.name}
                        </CardTitle>
                        <CardDescription>
                          NPC compartilhado pelo Mestre
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Clique para ver e rolar dados
                        </p>
                      </CardContent>
                    </Card>
                  </NpcSheetSheet>
                </Suspense>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Diário & Anotações</h3>
            <Suspense fallback={<Button size="sm" disabled><Plus className="w-4 h-4 mr-2" /> Carregando...</Button>}>
              <JournalEntryDialog
                tableId={tableId}
                onEntrySaved={loadData}
                isPlayerNote={true} 
              >
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Anotação Pessoal
                </Button>
              </JournalEntryDialog>
            </Suspense>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {journalEntries.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhuma anotação pública ou privada.
              </p>
            ) : (
              journalEntries.map((entry) => {
                let description = "Anotação Pública do Mestre";
                let isMyEntry = false; 

                if (entry.player) {
                  description = "Sua Anotação Pessoal";
                  isMyEntry = true;
                } else if (entry.character) {
                  description = `Diário de: ${entry.character.name}`;
                  isMyEntry = true; 
                } else if (entry.shared_with_players.includes(userId!)) {
                  description = "Compartilhado com você pelo Mestre";
                  // isMyEntry continua false, pois não posso editar
                }
                
                return (
                  <Card key={entry.id} className="border-border/50 flex flex-col">
                    <CardHeader>
                      <CardTitle>{entry.title}</CardTitle>
                      <CardDescription>
                        {description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <JournalRenderer content={entry.content} className="line-clamp-4" />
                    </CardContent>
                    {isMyEntry && (
                      <CardFooter className="flex justify-end items-center gap-2">
                        <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                          <JournalEntryDialog
                            tableId={tableId}
                            onEntrySaved={loadData}
                            entry={entry}
                            isPlayerNote={!!entry.player_id}
                            characterId={entry.character_id || undefined}
                          >
                            <Button variant="outline" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </JournalEntryDialog>
                        </Suspense>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setEntryToDelete(entry)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!characterToDelete}
        onOpenChange={(open) => !open && setCharacterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              A ficha "{characterToDelete?.name}" será removida permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCharacterToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleDeleteCharacter}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              A anotação "{entryToDelete?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJournalEntry}
              className={buttonVariants({ variant: "destructive" })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </div>
  );
};