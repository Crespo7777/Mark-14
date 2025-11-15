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

  // ######################################################
  // ### INÍCIO DA OTIMIZAÇÃO DE REALTIME ###
  // ######################################################

  // A função loadData() permanece a mesma, para a carga inicial
  const loadData = async () => {
    if (!userId) return;

    try {
      // (As RLS do Supabase já filtram automaticamente o que o jogador pode ver)
      const [charsRes, journalRes, npcsRes] = await Promise.all([
        supabase
          .from("characters")
          .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
          .eq("table_id", tableId),

        supabase
          .from("journal_entries")
          .select(
            `
            *,
            shared_with_players,
            player:profiles!journal_entries_player_id_fkey(display_name),
            character:characters!journal_entries_character_id_fkey(name),
            npc:npcs!journal_entries_npc_id_fkey(name)
          `,
          )
          .eq("table_id", tableId)
          .order("created_at", { ascending: false }),

        supabase
          .from("npcs")
          .select("*, shared_with_players")
          .eq("table_id", tableId)
          .order("name", { ascending: true }),
      ]);

      if (charsRes.error) throw charsRes.error;
      const allChars = (charsRes.data as any) || [];
      // Filtramos localmente apenas as fichas que pertencem a este jogador
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


  useEffect(() => {
    if (userId) {
      // 1. Carga inicial dos dados
      loadData();
    }

    // 2. Inscrição no canal de Realtime
    const channel = supabase
      .channel(`player-view:${tableId}:${userId}`) // Canal específico do jogador

      // --- CHARACTERS ---
      // (Aqui a lógica é um pouco diferente, pois só nos importamos com NOSSAS fichas)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          // Verifica se a nova ficha é minha
          if (payload.new.player_id === userId) {
            console.log("Realtime: Minha nova ficha inserida");
            // Buscamos a ficha para pegar o join de 'display_name'
            const { data: newChar } = await supabase
              .from("characters")
              .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
              .eq("id", payload.new.id)
              .single();
            if (newChar) {
              setMyCharacters((prev) => [...prev, newChar as any]);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          // Verifica se a ficha atualizada é minha
          if (payload.new.player_id === userId) {
            console.log("Realtime: Minha ficha atualizada");
            const { data: updatedChar } = await supabase
              .from("characters")
              .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
              .eq("id", payload.new.id)
              .single();
            if (updatedChar) {
              setMyCharacters((prev) =>
                prev.map((c) => (c.id === updatedChar.id ? (updatedChar as any) : c))
              );
            }
          } else {
             // A ficha pode ter sido minha e foi atribuída a outro.
             setMyCharacters((prev) => prev.filter((c) => c.id !== payload.new.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: Ficha deletada");
          // Remove da lista se for minha
          setMyCharacters((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )

      // --- NPCS ---
      // (A RLS do Supabase já filtra. Só receberemos eventos de NPCs compartilhados)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: Novo NPC compartilhado");
          setSharedNpcs((prev) => [...prev, payload.new as Npc]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          // Se o NPC foi atualizado para não ser mais compartilhado, a RLS pode não enviar o evento.
          // Mas se ele for atualizado E continuar compartilhado, atualizamos.
          // Se ele deixar de ser compartilhado, a RLS *pode* enviar um 'DELETE' lógico (ou nada).
          // A maneira mais segura é verificar se ele ainda é visível.
          if (payload.new.is_shared || (payload.new.shared_with_players || []).includes(userId!)) {
            console.log("Realtime: NPC compartilhado atualizado");
            setSharedNpcs((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Npc) : n))
            );
          } else {
            // Deixou de ser compartilhado, removemos da lista
            console.log("Realtime: NPC deixou de ser compartilhado");
            setSharedNpcs((prev) => prev.filter((n) => n.id !== payload.new.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: NPC deletado");
          setSharedNpcs((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      )

      // --- JOURNAL ENTRIES ---
      // (A RLS também filtra aqui)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "journal_entries", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          console.log("Realtime: Nova entrada no diário (visível para mim)");
          // Buscamos a entrada para pegar os joins
          const { data: newEntry } = await supabase
            .from("journal_entries")
            .select("*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)")
            .eq("id", payload.new.id)
            .single();
          if (newEntry) {
            setJournalEntries((prev) => [newEntry as any, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "journal_entries", filter: `table_id=eq.${tableId}` },
        async (payload) => {
            console.log("Realtime: Entrada de diário atualizada (visível para mim)");
            const { data: updatedEntry } = await supabase
            .from("journal_entries")
            .select("*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)")
            .eq("id", payload.new.id)
            .single();
          
          if (updatedEntry) {
            setJournalEntries((prev) =>
              prev.map((j) => (j.id === updatedEntry.id ? (updatedEntry as any) : j))
            );
          } else {
            // A entrada pode ter deixado de ser visível (ex: mestre removeu o share)
            setJournalEntries((prev) => prev.filter((j) => j.id !== payload.new.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "journal_entries", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: Entrada de diário deletada");
          setJournalEntries((prev) => prev.filter((j) => j.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, userId]); // Depende do userId para os filtros

  // ######################################################
  // ### FIM DA OTIMIZAÇÃO DE REALTIME ###
  // ######################################################


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
      // loadData(); // Não é mais necessário
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
      // loadData(); // Não é mais necessário
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
      // loadData(); // Não é mais necessário
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
              onCharacterCreated={() => {}} // Realtime cuida
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
                onEntrySaved={() => {}} // Realtime cuida
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

                if (entry.player_id === userId) {
                  description = "Sua Anotação Pessoal";
                  isMyEntry = true;
                } else if (entry.character) {
                    // Verifica se o personagem da nota é um dos meus
                    if(myCharacters.some(c => c.id === entry.character_id)) {
                        description = `Diário de: ${entry.character.name}`;
                        isMyEntry = true;
                    } else {
                        // É diário de outro personagem, não mostrar
                        return null; 
                    }
                } else if ((entry.shared_with_players || []).includes(userId!)) {
                  description = "Compartilhado com você pelo Mestre";
                } else if (!entry.is_shared) {
                  // Se não for pública, nem minha, nem compartilhada comigo, não mostra.
                  return null; 
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
                            onEntrySaved={() => {}} // Realtime cuida
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