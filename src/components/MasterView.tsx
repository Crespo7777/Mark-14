// src/components/MasterView.tsx

import { useEffect, useState } from "react";
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
import { Plus, Users, FileText, Trash2, BookOpen, Edit } from "lucide-react";
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
import { CharacterSheetSheet } from "./CharacterSheetSheet";

import { CreateNpcDialog } from "./CreateNpcDialog";
import { NpcSheetSheet } from "@/features/npc/NpcSheetSheet";
import { Database } from "@/integrations/supabase/types";

// Definir tipos para o State
type Character = Database["public"]["Tables"]["characters"]["Row"] & {
  player: { display_name: string };
};
type Npc = Database["public"]["Tables"]["npcs"]["Row"];
type Member = Database["public"]["Tables"]["table_members"]["Row"] & {
  user: { display_name: string };
};
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId, masterId }: MasterViewProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("characters");
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [npcToDelete, setNpcToDelete] = useState<Npc | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null,
  ); // NOVO STATE

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
        { event: "*", schema: "public", table: "characters" }, // Ouvir mudanças em Fichas
        (payload) => loadData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const loadData = async () => {
    const [charsRes, npcsRes, membersRes, journalRes] = await Promise.all([
      supabase
        .from("characters")
        .select("*, player:profiles!characters_player_id_fkey(display_name)")
        .eq("table_id", tableId),
      supabase.from("npcs").select("*").eq("table_id", tableId),
      supabase
        .from("table_members")
        .select("*, user:profiles!table_members_user_id_fkey(display_name)")
        .eq("table_id", tableId),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false }),
    ]);

    if (charsRes.data) setCharacters(charsRes.data as any);
    if (npcsRes.data) setNpcs(npcsRes.data);
    if (membersRes.data) setMembers(membersRes.data as any);
    if (journalRes.data) setJournalEntries(journalRes.data);
  };

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    const { error } = await supabase
      .from("table_members")
      .delete()
      .eq("id", playerToRemove.id);

    if (error) {
      toast({
        title: "Erro ao remover jogador",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Jogador removido",
        description: `${playerToRemove.name} foi removido da mesa.`,
      });
      loadData();
      setPlayerToRemove(null);
    }
  };

  // --- FUNÇÕES DE COMPARTILHAMENTO ---
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

  // NOVA FUNÇÃO: Compartilhar Ficha de Personagem
  const handleShareCharacter = async (charId: string, is_shared: boolean) => {
    const { error } = await supabase
      .from("characters")
      .update({ is_shared })
      .eq("id", charId);
    if (error) toast({ title: "Erro", variant: "destructive" });
    else {
      toast({ title: "Visibilidade da Ficha atualizada!" });
      setCharacters((prev) =>
        prev.map((c) => (c.id === charId ? { ...c, is_shared } : c)),
      );
    }
  };

  // --- FUNÇÕES DE DELETAR ---
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

  // NOVA FUNÇÃO: Deletar Ficha de Personagem
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

        {/* SEÇÃO DE PERSONAGENS ATUALIZADA */}
        <TabsContent value="characters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Fichas dos Jogadores</h3>
            <CreateCharacterDialog
              tableId={tableId}
              masterId={masterId}
              members={members}
              onCharacterCreated={loadData}
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Ficha
              </Button>
            </CreateCharacterDialog>
          </div>
          {/* ... (filtro de jogador) ... */}
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
                  <CharacterSheetSheet key={char.id} characterId={char.id}>
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
                      {/* Footer adicionado ao Card de Personagem */}
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
                ))
            )}
          </div>
        </TabsContent>

        {/* SEÇÃO DE NPCS (Como estava antes) */}
        <TabsContent value="npcs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">NPCs da Mesa</h3>
            <CreateNpcDialog tableId={tableId} onNpcCreated={loadData}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo NPC
              </Button>
            </CreateNpcDialog>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {npcs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum NPC criado ainda
              </p>
            ) : (
              npcs.map((npc) => (
                <NpcSheetSheet key={npc.id} npcId={npc.id}>
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
              ))
            )}
          </div>
        </TabsContent>

        {/* ... (Seção de Jogadores) ... */}
        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
          {/* ... (map de 'members') ... */}
        </TabsContent>

        {/* ... (Seção do Diário) ... */}
        <TabsContent value="journal" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Diário do Mestre</h3>
          {/* ... (map de 'journalEntries') ... */}
        </TabsContent>
      </Tabs>

      {/* ... (AlertDialog para Remover Jogador) ... */}
      <AlertDialog
        open={!!playerToRemove}
        onOpenChange={(open) => !open && setPlayerToRemove(null)}
      >
        {/* ... (Conteúdo) ... */}
      </AlertDialog>

      {/* ... (AlertDialog para Deletar Entrada do Diário) ... */}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        {/* ... (Conteúdo) ... */}
      </AlertDialog>

      {/* ... (AlertDialog para Deletar NPC) ... */}
      <AlertDialog
        open={!!npcToDelete}
        onOpenChange={(open) => !open && setNpcToDelete(null)}
      >
        {/* ... (Conteúdo) ... */}
      </AlertDialog>

      {/* NOVO: AlertDialog para Deletar Ficha de Personagem */}
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