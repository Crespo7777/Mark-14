import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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

interface MasterViewProps {
  tableId: string;
  masterId: string; // Necessário para o CreateCharacterDialog
}

export const MasterView = ({ tableId, masterId }: MasterViewProps) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("characters");
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<{ id: string, name: string } | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null);

  useEffect(() => {
    loadData();

    // Listener do Realtime para o Diário
    const channel = supabase
      .channel(`journal:${tableId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `table_id=eq.${tableId}` },
        (payload) => {
          loadData(); // Simplesmente recarrega tudo
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const loadData = async () => {
    const [charsRes, npcsRes, membersRes, journalRes] = await Promise.all([
      supabase.from("characters").select("*, player:profiles!characters_player_id_fkey(display_name)").eq("table_id", tableId),
      supabase.from("npcs").select("*").eq("table_id", tableId),
      supabase.from("table_members").select("*, user:profiles!table_members_user_id_fkey(display_name)").eq("table_id", tableId),
      supabase.from("journal_entries").select("*").eq("table_id", tableId).order("created_at", { ascending: false }),
    ]);

    if (charsRes.data) setCharacters(charsRes.data);
    if (npcsRes.data) setNpcs(npcsRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    if (journalRes.data) setJournalEntries(journalRes.data);
  };

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    const { error } = await supabase
      .from("table_members")
      .delete()
      .eq("id", playerToRemove.id);

    if (error) {
      toast({ title: "Erro ao remover jogador", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Jogador removido", description: `${playerToRemove.name} foi removido da mesa.` });
      loadData();
      setPlayerToRemove(null);
    }
  };

  const handleShareJournal = async (entryId: string, is_shared: boolean) => {
    const { error } = await supabase
      .from("journal_entries")
      .update({ is_shared })
      .eq("id", entryId);
    
    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o compartilhamento.", variant: "destructive" });
    } else {
      toast({ title: "Visibilidade atualizada!", variant: "default" });
      setJournalEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, is_shared } : entry
        )
      );
    }
  };

  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryToDelete.id);
    
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entrada excluída", description: `'${entryToDelete.title}' foi removida.` });
      setEntryToDelete(null);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Mestre</h2>
        <p className="text-muted-foreground">Controle total sobre a mesa</p>
      </div>

      <Tabs defaultValue="characters" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters">
            <FileText className="w-4 h-4 mr-2" />
            Personagens
          </TabsTrigger>
          <TabsTrigger value="npcs">
            <Users className="w-4 h-4 mr-2" />
            NPCs
          </TabsTrigger>
          <TabsTrigger value="players">
            <Users className="w-4 h-4 mr-2" />
            Jogadores
          </TabsTrigger>
          <TabsTrigger value="journal">
            <BookOpen className="w-4 h-4 mr-2" />
            Diário
          </TabsTrigger>
        </TabsList>

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

          {playerFilter && (
            <div className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-border/50">
              <span className="text-sm font-medium text-accent-foreground">
                Mostrando fichas de: {members.find(m => m.user_id === playerFilter)?.user.display_name}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPlayerFilter(null)}>
                Limpar Filtro
              </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {characters.filter(char => !playerFilter || char.player_id === playerFilter).length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                {playerFilter ? "Este jogador não possui fichas." : "Nenhum personagem criado ainda."}
              </p>
            ) : (
              characters
                .filter(char => !playerFilter || char.player_id === playerFilter)
                .map((char) => (
                  <CharacterSheetSheet key={char.id} characterId={char.id}>
                    <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle>{char.name}</CardTitle>
                        <CardDescription>Jogador: {char.player.display_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Clique para ver detalhes</p>
                      </CardContent>
                    </Card>
                  </CharacterSheetSheet>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="npcs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">NPCs da Mesa</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo NPC
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {npcs.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum NPC criado ainda
              </p>
            ) : (
              npcs.map((npc) => (
                <Card key={npc.id} className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{npc.name}</CardTitle>
                    <CardDescription>
                      {npc.is_shared ? "Compartilhado com jogadores" : "Apenas mestre"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Clique para editar</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum jogador na mesa ainda
              </p>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="border-border/50">
                  <CardHeader>
                    <CardTitle>{member.user.display_name}</CardTitle>
                    <CardDescription>
                      Entrou em {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPlayerFilter(member.user_id);
                        setActiveTab("characters");
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Fichas
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setPlayerToRemove({ id: member.id, name: member.user.display_name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

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
                Nenhuma entrada no diário ainda.
              </p>
            ) : (
              journalEntries.map((entry) => (
                <Card key={entry.id} className="border-border/50 flex flex-col">
                  <CardHeader>
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>
                      Atualizado em {new Date(entry.updated_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {entry.content || "Sem conteúdo"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`share-${entry.id}`}
                        checked={entry.is_shared}
                        onCheckedChange={(checked) => handleShareJournal(entry.id, checked)}
                      />
                      <Label htmlFor={`share-${entry.id}`}>Compartilhar</Label>
                    </div>
                    <div className="flex gap-1">
                      <JournalEntryDialog tableId={tableId} onEntrySaved={loadData} entry={entry}>
                        <Button variant="outline" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </JournalEntryDialog>
                      <Button variant="destructive" size="icon" onClick={() => setEntryToDelete(entry)}>
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

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover permanentemente {playerToRemove?.name} da mesa.
              As fichas de personagem criadas por ele não serão excluídas, mas
              ficarão sem um jogador associado até que você as reatribua.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlayerToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePlayer} className={buttonVariants({ variant: "destructive" })}>
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              A entrada "{entryToDelete?.title}" será removida permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJournalEntry} className={buttonVariants({ variant: "destructive" })}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};