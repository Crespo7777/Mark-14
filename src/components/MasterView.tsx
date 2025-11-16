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
import {
  Plus,
  Users,
  FileText,
  Trash2,
  BookOpen,
  Edit,
  UserX,
  Copy,
  MoreVertical,
  Share2,
  Bot, // <-- 1. IMPORTAR ÍCONE
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

import { useTableContext, TableMember } from "@/features/table/TableContext"; // Importa TableMember
import { DiscordSettingsDialog } from "./DiscordSettingsDialog"; // <-- 2. IMPORTAR NOVO DIÁLOGO

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

type Character = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"];
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  player: { display_name: string } | null;
  character: { name: string } | null;
  npc: { name: string } | null;
};

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId, masterId }: MasterViewProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);

  // Mantém os membros do contexto (já atualizados pelo TableView)
  const { members, setMembers } = useTableContext();

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("characters");
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<any | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [npcToDelete, setNpcToDelete] = useState<Npc | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null,
  );
  const [duplicating, setDuplicating] = useState(false);

  // ######################################################
  // ### INÍCIO DA OTIMIZAÇÃO DE REALTIME ###
  // ######################################################

  // A função loadData() permanece a mesma, para a carga inicial
  const loadData = async () => {
    const [charsRes, npcsRes, journalRes, membersRes, tableRes] = await Promise.all([
      supabase
        .from("characters")
        .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
        .eq("table_id", tableId),
      supabase.from("npcs").select("*, shared_with_players").eq("table_id", tableId),
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
      // Também recarregamos os membros aqui, caso o contexto ainda não tenha
      supabase
        .from("table_members")
        .select("user:profiles!table_members_user_id_fkey(id, display_name)")
        .eq("table_id", tableId),
      supabase
        .from("tables")
        .select("master:profiles!tables_master_id_fkey(id, display_name)")
        .eq("id", tableId)
        .single(),
    ]);

    if (charsRes.data) setCharacters(charsRes.data as any);
    if (npcsRes.data) setNpcs(npcsRes.data);
    if (journalRes.data) setJournalEntries(journalRes.data as any);
    
    // Atualiza a lista de membros no contexto (caso venha do realtime)
    if (membersRes.data && tableRes.data) {
        const masterProfile = (tableRes.data as any).master;
        const memberList: TableMember[] = [
          { 
            id: masterProfile.id, 
            display_name: masterProfile.display_name, 
            isMaster: true 
          },
          ...membersRes.data.map((m: any) => ({
            id: m.user.id,
            display_name: m.user.display_name,
            isMaster: false,
          }))
        ];
        setMembers(memberList);
    }
  };


  useEffect(() => {
    // 1. Carga inicial dos dados
    loadData();

    // 2. Inscrição no canal de Realtime
    const channel = supabase
      .channel(`master-view:${tableId}`)

      // --- CHARACTERS ---
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          console.log("Realtime: Novo personagem inserido");
          // Buscamos o personagem individualmente para pegar o 'join' com 'profiles'
          const { data: newChar } = await supabase
            .from("characters")
            .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
            .eq("id", payload.new.id)
            .single();
          if (newChar) {
            setCharacters((prev) => [...prev, newChar as any]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          console.log("Realtime: Personagem atualizado");
          // Buscamos o personagem individualmente para pegar o 'join' com 'profiles'
          const { data: updatedChar } = await supabase
            .from("characters")
            .select("*, shared_with_players, player:profiles!characters_player_id_fkey(display_name)")
            .eq("id", payload.new.id)
            .single();
          if (updatedChar) {
            setCharacters((prev) =>
              prev.map((c) => (c.id === updatedChar.id ? (updatedChar as any) : c))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "characters", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: Personagem deletado");
          setCharacters((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )

      // --- NPCS ---
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: Novo NPC");
          setNpcs((prev) => [...prev, payload.new as Npc]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: NPC atualizado");
          setNpcs((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Npc) : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "npcs", filter: `table_id=eq.${tableId}` },
        (payload) => {
          console.log("Realtime: NPC deletado");
          setNpcs((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      )

      // --- JOURNAL ENTRIES ---
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "journal_entries", filter: `table_id=eq.${tableId}` },
        async (payload) => {
          console.log("Realtime: Nova entrada no diário");
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
          console.log("Realtime: Entrada de diário atualizada");
          // Buscamos a entrada para pegar os joins
          const { data: updatedEntry } = await supabase
            .from("journal_entries")
            .select("*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)")
            .eq("id", payload.new.id)
            .single();
          if (updatedEntry) {
            setJournalEntries((prev) =>
              prev.map((j) => (j.id === updatedEntry.id ? (updatedEntry as any) : j))
            );
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
      
      // --- TABLE MEMBERS (Recarrega a lista de membros) ---
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_members", filter: `table_id=eq.${tableId}` },
        (payload) => {
            console.log("Realtime: Membros da mesa atualizados");
            // loadData() é muito pesado, vamos recarregar apenas os membros
            loadMembers();
        }
      )
      .subscribe();
      
    // Função auxiliar para recarregar apenas os membros
    const loadMembers = async () => {
        const { data: membersData } = await supabase
          .from("table_members")
          .select("user:profiles!table_members_user_id_fkey(id, display_name)")
          .eq("table_id", tableId);
          
        const { data: tableData } = await supabase
          .from("tables")
          .select("master:profiles!tables_master_id_fkey(id, display_name)")
          .eq("id", tableId)
          .single();

        if (membersData && tableData) {
            const masterProfile = (tableData as any).master;
            const memberList: TableMember[] = [
              { 
                id: masterProfile.id, 
                display_name: masterProfile.display_name, 
                isMaster: true 
              },
              ...membersData.map((m: any) => ({
                id: m.user.id,
                display_name: m.user.display_name,
                isMaster: false,
              }))
            ];
            setMembers(memberList);
        }
    };

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, setMembers]); // Adicionado setMembers à dependência

  // ######################################################
  // ### FIM DA OTIMIZAÇÃO DE REALTIME ###
  // ######################################################


  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    const { error: memberError } = await supabase
      .from("table_members")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", playerToRemove.id);

    if (memberError) {
      toast({ title: "Erro ao remover jogador", description: memberError.message, variant: "destructive" });
      setPlayerToRemove(null);
      return;
    }

    const { error: charError } = await supabase
      .from("characters")
      .delete()
      .eq("table_id", tableId)
      .eq("player_id", playerToRemove.id);

    if (charError) {
      toast({ title: "Erro ao limpar fichas", description: `O jogador foi removido, mas houve um erro ao deletar suas fichas: ${charError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Jogador removido", description: `${playerToRemove.display_name} foi removido da mesa e suas fichas foram limpas.` });
    }
    // window.location.reload(); // Não precisamos mais disso, o realtime vai atualizar
    setPlayerToRemove(null);
  };

  const handleDeleteNpc = async () => {
    if (!npcToDelete) return;

    await supabase.from("journal_entries").update({ npc_id: null }).eq("npc_id", npcToDelete.id);

    const { error } = await supabase
      .from("npcs")
      .delete()
      .eq("id", npcToDelete.id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "NPC excluído" });
      setNpcToDelete(null);
      // loadData(); // Não precisamos mais disso
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
      // loadData(); // Não precisamos mais disso
    }
  };
  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;

    await supabase.from("journal_entries").update({ character_id: null }).eq("character_id", characterToDelete.id);

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterToDelete.id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Ficha excluída" });
      setCharacterToDelete(null);
      // loadData(); // Não precisamos mais disso
    }
  };

  const handleDuplicateNpc = async (npcToDuplicate: Npc) => {
    setDuplicating(true);

    const newName = `Cópia de ${npcToDuplicate.name}`;

    const newData = JSON.parse(JSON.stringify(npcToDuplicate.data || {}));
    newData.name = newName;

    const { error } = await supabase.from("npcs").insert({
      table_id: tableId,
      name: newName,
      data: newData,
      is_shared: false,
      shared_with_players: [],
    });

    if (error) {
      toast({ title: "Erro ao duplicar NPC", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "NPC Duplicado!", description: `${newName} foi criado.` });
      // loadData(); // Não precisamos mais disso
    }
    setDuplicating(false);
  };

  const handleDuplicateCharacter = async (charToDuplicate: Character) => {
    setDuplicating(true);

    const newName = `Cópia de ${charToDuplicate.name}`;

    const newData = JSON.parse(JSON.stringify(charToDuplicate.data || {}));
    newData.name = newName;

    const { error } = await supabase.from("characters").insert({
      table_id: tableId,
      player_id: charToDuplicate.player_id,
      name: newName,
      data: newData,
      is_shared: false,
      shared_with_players: [],
    });

    if (error) {
      toast({ title: "Erro ao duplicar Ficha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficha Duplicada!", description: `${newName} foi criada para ${charToDuplicate.player.display_name}.` });
      // loadData(); // Não precisamos mais disso
    }
    setDuplicating(false);
  };

  const handleUpdateSharing = async (
    itemId: string,
    itemType: 'characters' | 'npcs' | 'journal_entries',
    newPlayerIds: string[]
  ) => {
    const allPlayerIds = members.filter(m => !m.isMaster).map(p => p.id);
    const isSharedWithEveryone = allPlayerIds.length > 0 && newPlayerIds.length === allPlayerIds.length;

    const { error } = await supabase
      .from(itemType)
      .update({
        shared_with_players: newPlayerIds,
        is_shared: isSharedWithEveryone,
      })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Erro ao compartilhar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compartilhamento atualizado!" });
      // loadData(); // Não precisamos mais disso, o realtime de UPDATE vai pegar
    }
  };


  return (
    <div className="space-y-6">
      <div>
        {/* --- 3. BOTÃO ADICIONADO AQUI --- */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2"> 
          <h2 className="text-3xl font-bold">Painel do Mestre</h2>
          <Suspense fallback={<Button variant="outline" size="sm" disabled>Carregando...</Button>}>
            <DiscordSettingsDialog />
          </Suspense>
        </div>
        {/* --- FIM DA ADIÇÃO --- */}
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
              members={members}
              onCharacterCreated={() => {}} // Não precisa mais do loadData, o realtime cuida
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
                            Jogador: {char.player?.display_name || "..."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {char.is_shared
                              ? "Compartilhado com TODOS"
                              : (char.shared_with_players || []).length > 0
                              ? `Compartilhado com ${(char.shared_with_players || []).length} jogador(es)`
                              : "Visível apenas para o dono e mestre"}
                          </p>
                        </CardContent>

                        <CardFooter className="flex justify-between items-center">
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ShareDialog
                              itemTitle={char.name}
                              currentSharedWith={char.shared_with_players || []}
                              disabled={duplicating}
                              onSave={(newPlayerIds) =>
                                handleUpdateSharing(char.id, 'characters', newPlayerIds)
                              }
                            >
                              <Button variant="outline" size="sm">
                                <Share2 className="w-4 h-4 mr-2" />
                                Compartilhar
                              </Button>
                            </ShareDialog>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                disabled={duplicating}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleDuplicateCharacter(char)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setCharacterToDelete(char)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

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
              <CreateNpcDialog tableId={tableId} onNpcCreated={() => {}} /* Realtime cuida */ >
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
                            ? "Compartilhado com TODOS"
                            : (npc.shared_with_players || []).length > 0
                            ? `Compartilhado com ${(npc.shared_with_players || []).length} jogador(es)`
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
                          className="flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ShareDialog
                            itemTitle={npc.name}
                            currentSharedWith={npc.shared_with_players || []}
                            disabled={duplicating}
                            onSave={(newPlayerIds) =>
                              handleUpdateSharing(npc.id, 'npcs', newPlayerIds)
                            }
                          >
                            <Button variant="outline" size="sm">
                              <Share2 className="w-4 h-4 mr-2" />
                              Compartilhar
                            </Button>
                          </ShareDialog>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              disabled={duplicating}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleDuplicateNpc(npc)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setNpcToDelete(npc)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </CardFooter>
                    </Card>
                  </NpcSheetSheet>
                </Suspense>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
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

        <TabsContent value="journal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Diário da Mesa</h3>
            <Suspense fallback={<Button size="sm" disabled><Plus className="w-4 h-4 mr-2" /> Carregando...</Button>}>
              <JournalEntryDialog tableId={tableId} onEntrySaved={() => {}} /* Realtime cuida */ >
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada (Mestre)
                </Button>
              </JournalEntryDialog>
            </Suspense>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {journalEntries.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhuma entrada no diário.
              </p>
            ) : (
              journalEntries.map((entry) => {
                let description = "Anotação do Mestre";
                let canShare = true;

                if (entry.player) {
                  description = `Anotação de: ${entry.player.display_name}`;
                  canShare = false;
                } else if (entry.character) {
                  description = `Diário de: ${entry.character.name}`;
                  canShare = false;
                } else if (entry.npc) {
                  description = `Anotação sobre: ${entry.npc.name}`;
                  canShare = false;
                
                } else if (entry.is_shared) {
                  description = "Público (Compartilhado com TODOS)";
                } else if ((entry.shared_with_players || []).length > 0) {
                  description = `Compartilhado com ${(entry.shared_with_players || []).length} jogador(es)`;
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
                      {/* --- INÍCIO DA CORREÇÃO: Remover line-clamp --- */}
                      <JournalRenderer content={entry.content} />
                      {/* --- FIM DA CORREÇÃO --- */}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <div
                          className="flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canShare ? (
                            <ShareDialog
                              itemTitle={entry.title}
                              currentSharedWith={entry.shared_with_players || []}
                              onSave={(newPlayerIds) =>
                                handleUpdateSharing(entry.id, 'journal_entries', newPlayerIds)
                              }
                            >
                              <Button variant="outline" size="sm">
                                <Share2 className="w-4 h-4 mr-2" />
                                Compartilhar
                              </Button>
                            </ShareDialog>
                          ) : (
                            <div />
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                            <JournalEntryDialog
                              tableId={tableId}
                              onEntrySaved={() => {}} /* Realtime cuida */
                              entry={entry}
                              isPlayerNote={!!entry.player_id}
                              characterId={entry.character_id || undefined}
                              npcId={entry.npc_id || undefined}
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
                        </div>
                      </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* (Todos os AlertDialogs... sem alterações) */}
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