// src/components/MasterView.tsx

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, FileText, Trash2, BookOpen, Edit, UserX } from "lucide-react";
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
import { JournalEntryDialog } from "./JournalEntryDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JournalRenderer } from "./JournalRenderer";
import { Skeleton } from "@/components/ui/skeleton";

// --- 1. IMPORTAR O CONTEXTO ---
import { useTableContext } from "@/features/table/TableContext";

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

// Tipos (o tipo Member agora vem do contexto)
type Character = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"];
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId, masterId }: MasterViewProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  
  // --- 2. PEGAR MEMBROS DO CONTEXTO ---
  // Removemos o 'members' do useState e pegamos do contexto
  const { members } = useTableContext(); 
  // --- FIM DA ADIÇÃO ---
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("characters");
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<any | null>(null); // Tipo ajustado
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [npcToDelete, setNpcToDelete] = useState<Npc | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null,
  );

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`master-view:${tableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entries" },
        (payload) => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "npcs" },
        (payload) => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        (payload) => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_members" },
        (payload) => loadData(), // Mantemos isso caso um novo jogador entre
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  // --- 3. ATUALIZAR 'loadData' ---
  // Removemos a busca por 'members' daqui
  const loadData = async () => {
    const [charsRes, npcsRes, journalRes] = await Promise.all([
      supabase
        .from("characters")
        .select("*, player:profiles!characters_player_id_fkey(display_name)")
        .eq("table_id", tableId),
      supabase.from("npcs").select("*").eq("table_id", tableId),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false }),
    ]);

    if (charsRes.data) setCharacters(charsRes.data as any);
    if (npcsRes.data) setNpcs(npcsRes.data);
    if (journalRes.data) setJournalEntries(journalRes.data);
    
    // A busca por 'table_members' foi removida daqui
  };
  // --- FIM DA ATUALIZAÇÃO ---

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    
    // --- 4. ATUALIZAR LÓGICA DE REMOÇÃO ---
    // A lógica de remoção de 'table_members' precisa ser refeita
    // pois 'playerToRemove' agora é do tipo 'TableMember'
    
    // Primeiro, deletamos da tabela 'table_members'
    const { error: memberError } = await supabase
      .from("table_members")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", playerToRemove.id); // Usamos o ID do membro

    if (memberError) {
      toast({
        title: "Erro ao remover jogador",
        description: memberError.message,
        variant: "destructive",
      });
      setPlayerToRemove(null);
      return;
    }
    
    // Segundo, deletamos as fichas
    const { error: charError } = await supabase
      .from("characters")
      .delete()
      .eq("table_id", tableId)
      .eq("player_id", playerToRemove.id); // Usamos o ID do membro

    if (charError) {
       toast({
        title: "Erro ao limpar fichas",
        description: `O jogador foi removido, mas houve um erro ao deletar suas fichas: ${charError.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Jogador removido",
        description: `${playerToRemove.display_name} foi removido da mesa e suas fichas foram limpas.`,
      });
    }

    // loadData(); // 'loadData' não busca mais membros
    // Disparar um reload da página inteira é a forma mais fácil 
    // de forçar o 'TableView' a recarregar a lista de membros.
    window.location.reload();
    setPlayerToRemove(null);
    // --- FIM DA ATUALIZAÇÃO ---
  };
  
  // (O resto das funções handle... permanece igual)
  const handleShareJournal = async (entryId: string, is_shared: boolean) => {
    const { error } = await supabase
      .from("journal_entries")
      .update({ is_shared })
      .eq("id", entryId);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Visibilidade do Diário atualizada!" });
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, is_shared } : e)),
      );
    }
  };
  const handleShareNpc = async (npcId: string, is_shared: boolean) => {
    const { error } = await supabase
      .from("npcs")
      .update({ is_shared })
      .eq("id", npcId);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Visibilidade do NPC atualizada!" });
      setNpcs((prev) =>
        prev.map((n) => (n.id === npcId ? { ...n, is_shared } : n)),
      );
    }
  };
  const handleShareCharacter = async (charId: string, is_shared: boolean) => {
    const { error } = await supabase
      .from("characters")
      .update({ is_shared })
      .eq("id", charId);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Visibilidade da Ficha atualizada!" });
      setCharacters((prev) =>
        prev.map((c) => (c.id === charId ? { ...c, is_shared } : e)),
      );
    }
  };
  const handleDeleteNpc = async () => {
    if (!npcToDelete) return;
    const { error } = await supabase
      .from("npcs")
      .delete()
      .eq("id", npcToDelete.id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "NPC excluído" });
      setNpcToDelete(null);
      loadData();
    }
  };
  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryToDelete.id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Entrada excluída" });
      setEntryToDelete(null);
      loadData();
    }
  };
  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterToDelete.id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Ficha excluída" });
      setCharacterToDelete(null);
      loadData();
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Mestre</h2>
        <p className="text-muted-foreground">Controle total sobre a mesa</p>
      </div>

      <Tabs
        defaultValue="characters"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="journal">Diário</TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Fichas dos Jogadores</h3>
            <CreateCharacterDialog
              tableId={tableId}
              masterId={masterId}
              members={members} // Passamos os membros do contexto
              onCharacterCreated={loadData}
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </CreateCharacterDialog>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {characters.filter(
              (char) => !playerFilter || char.player_id === playerFilter,
            ).length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum personagem criado ainda.
              </p>
            ) : (
              characters
                .filter(
                  (char) => !playerFilter || char.player_id === playerFilter,
                )
                .map((char) => (
                  <Suspense key={char.id} fallback={<SheetLoadingFallback />}>
                    <CharacterSheetSheet characterId={char.id}>
                      <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col">
                        <CardHeader>
                          <CardTitle>{char.name}</CardTitle>
                          <CardDescription>
                            Jogador: {char.player.display_name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {char.is_shared
                              ? "Compartilhado com jogadores"
                              : "Visível apenas para o dono e mestre"}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Switch
                              id={`share-char-${char.id}`}
                              checked={char.is_shared ?? false}
                              onCheckedChange={(checked) =>
                                handleShareCharacter(char.id, checked)
                              }
                            />
                            <Label htmlFor={`share-char-${char.id}`}>
                              Compartilhar
                            </Label>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCharacterToDelete(char);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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
            <h3 className="text-xl font-semibold">NPCs da Mesa</h3>
            <Suspense fallback={<Button size="sm" disabled><Plus className="w-4 h-4 mr-2" /> Carregando...</Button>}>
              <CreateNpcDialog tableId={tableId} onNpcCreated={loadData}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo NPC
                </Button>
              </CreateNpcDialog>
            </Suspense>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {npcs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum NPC criado ainda
              </p>
            ) : (
              npcs.map((npc) => (
                <Suspense key={npc.id} fallback={<SheetLoadingFallback />}>
                  <NpcSheetSheet npcId={npc.id}>
                    <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col">
                      <CardHeader>
                        <CardTitle>{npc.name}</CardTitle>
                        <CardDescription>
                          {npc.is_shared
                            ? "Compartilhado com jogadores"
                            : "Apenas mestre"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Clique para editar
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            id={`share-npc-${npc.id}`}
                            checked={npc.is_shared ?? false}
                            onCheckedChange={(checked) =>
                              handleShareNpc(npc.id, checked)
                            }
                          />
                          <Label htmlFor={`share-npc-${npc.id}`}>
                            Compartilhar
                          </Label>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNpcToDelete(npc);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </NpcSheetSheet>
                </Suspense>
              ))
            )}
          </div>
        </TabsContent>

        {/* --- 5. ATUALIZAR A LISTAGEM DE JOGADORES --- */}
        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
          {/* Filtramos o mestre da lista de "jogadores" */}
          {members.filter(m => !m.isMaster).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum jogador entrou na sua mesa ainda.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.filter(m => !m.isMaster).map((member) => (
                <Card key={member.id} className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg">
                        {member.display_name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setPlayerToRemove(member)}
                    >
                      <UserX className="w-4 h-4" />
                      <span className="sr-only">Remover jogador</span>
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {/* --- FIM DA ATUALIZAÇÃO --- */}


        <TabsContent value="journal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Diário do Mestre</h3>
            <JournalEntryDialog tableId={tableId} onEntrySaved={loadData}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>
            </JournalEntryDialog>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {journalEntries.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhuma entrada no diário.
              </p>
            ) : (
              journalEntries.map((entry) => (
                <Card key={entry.id} className="border-border/50 flex flex-col">
                  <CardHeader>
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>
                      {entry.player_id
                        ? `Anotação de: ${members.find(m => m.id === entry.player_id)?.display_name || 'Jogador'}`
                        : entry.is_shared
                        ? "Público (Jogadores podem ver)"
                        : "Privado (Apenas Mestre)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <JournalRenderer content={entry.content} />
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                      {!entry.player_id && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            id={`share-journal-${entry.id}`}
                            checked={entry.is_shared ?? false}
                            onCheckedChange={(checked) =>
                              handleShareJournal(entry.id, checked)
                            }
                          />
                          <Label htmlFor={`share-journal-${entry.id}`}>
                            Compartilhar
                          </Label>
                        </div>
                      )}
                      {entry.player_id && <div />}
                      
                      <div className="flex gap-2">
                        <JournalEntryDialog
                          tableId={tableId}
                          onEntrySaved={loadData}
                          entry={entry}
                          isPlayerNote={!!entry.player_id} 
                        >
                          <Button variant="outline" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </JournalEntryDialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setEntryToDelete(entry)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!playerToRemove}
        onOpenChange={(open) => !open && setPlayerToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Jogador?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que quer remover{" "}
              <span className="font-bold text-destructive">
                {playerToRemove?.display_name}
              </span>{" "}
              da mesa? Todas as fichas de personagem associadas a este jogador
              nesta mesa também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePlayer}
              className={buttonVariants({ variant: "destructive" })}
            >
              Remover Jogador
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
            <AlertDialogTitle>Excluir esta Entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              A entrada "{entryToDelete?.title}" será removida permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJournalEntry}
              className={buttonVariants({ variant: "destructive" })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!npcToDelete}
        onOpenChange={(open) => !open && setNpcToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este NPC?</AlertDialogTitle>
            <AlertDialogDescription>
              O NPC "{npcToDelete?.name}" será removido permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNpc}
              className={buttonVariants({ variant: "destructive" })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!characterToDelete}
        onOpenChange={(open) => !open && setCharacterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Ficha?</AlertDialogTitle>
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
              onClick={handleDeleteCharacter}
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