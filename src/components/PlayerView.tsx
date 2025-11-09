// src/components/PlayerView.tsx

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
import { Plus, Trash2, BookOpen, Edit } from "lucide-react"; // Adicionado BookOpen, Edit
import { useToast } from "@/hooks/use-toast";
import { CharacterSheetSheet } from "./CharacterSheetSheet";
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
import { Database } from "@/integrations/supabase/types"; // Importar Types
import { JournalEntryDialog } from "./JournalEntryDialog"; // Importar Diálogo do Diário
import { Separator } from "@/components/ui/separator"; // Importar Separator

interface PlayerViewProps {
  tableId: string;
}

type MyCharacter = {
  id: string;
  name: string;
  created_at: string;
  player: {
    display_name: string;
  };
  player_id: string;
};

// NOVO: Tipo para as entradas do Diário
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [characterToDelete, setCharacterToDelete] = useState<MyCharacter | null>(
    null,
  );

  // --- NOVOS ESTADOS PARA O DIÁRIO ---
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  // --- FIM DOS NOVOS ESTADOS ---

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`player-view:${tableId}`) // Canal renomeado para cobrir tudo
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => loadData(),
      )
      // --- ADICIONADO: Ouvir mudanças no Diário ---
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_entries",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => loadData(),
      )
      // --- FIM DA ADIÇÃO ---
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    try {
      // --- ATUALIZADO: Carregar Fichas e Diário em paralelo ---
      const [charsRes, journalRes] = await Promise.all([
        supabase
          .from("characters")
          .select("*, player:profiles!characters_player_id_fkey(display_name)")
          .eq("table_id", tableId)
          .eq("player_id", user.id),
        
        supabase
          .from("journal_entries")
          .select("*")
          .eq("table_id", tableId)
          // A RLS garante que o jogador
          // só verá as entradas públicas (player_id IS NULL AND is_shared = true)
          // OU as suas próprias (player_id = user.id)
          .order("created_at", { ascending: false }),
      ]);
      // --- FIM DA ATUALIZAÇÃO ---

      if (charsRes.error) throw charsRes.error;
      setMyCharacters((charsRes.data as any) || []);

      if (journalRes.error) throw journalRes.error;
      setJournalEntries(journalRes.data || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados do jogador:", error.message);
      toast({
        title: "Erro ao carregar dados",
        description: "Houve um problema ao buscar suas fichas ou diário.",
        variant: "destructive",
      });
      setMyCharacters([]);
      setJournalEntries([]);
    }
  };

  const handleDeleteCharacter = async () => {
    // ... (Função sem alteração)
    if (!characterToDelete) return;
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterToDelete.id);
    if (error) {
      toast({
        title: "Erro ao excluir ficha",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ficha excluída!",
        description: `A ficha ${characterToDelete.name} foi removida.`,
      });
      loadData(); 
    }
    setCharacterToDelete(null); 
  };

  // --- NOVA FUNÇÃO: Deletar Entrada do Diário ---
  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    
    // A RLS
    // garante que o jogador SÓ pode deletar se entryToDelete.player_id === user.id
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryToDelete.id);

    if (error) {
       toast({
        title: "Erro ao excluir anotação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Anotação excluída" });
      setEntryToDelete(null);
      loadData();
    }
  };
  // --- FIM DA NOVA FUNÇÃO ---

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

      {/* Seção Minhas Fichas (Sem alteração) */}
      <div className="space-y-4">
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
              Você ainda não criou nenhum personagem. Clique em "Nova Ficha" para começar.
            </p>
          ) : (
            myCharacters.map((char) => (
              <Card key={char.id} className="border-border/50 flex flex-col justify-between">
                <CharacterSheetSheet characterId={char.id}>
                  <div className="flex-1 hover:shadow-glow transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle>{char.name}</CardTitle>
                      <CardDescription>
                        Sua Ficha
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Clique para editar
                      </p>
                    </CardContent>
                  </div>
                </CharacterSheetSheet>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
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
            ))
          )}
        </div>
      </div>

      <Separator />

      {/* --- NOVA SEÇÃO: MEU DIÁRIO --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Meu Diário</h3>
          <JournalEntryDialog
            tableId={tableId}
            onEntrySaved={loadData}
            isPlayerNote={true} // <-- IMPORTANTE: Diz ao diálogo que é um jogador
          >
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Anotação
            </Button>
          </JournalEntryDialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {journalEntries.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhuma anotação pública ou privada.
            </p>
          ) : (
            journalEntries.map((entry) => {
              const isMyNote = entry.player_id === userId;
              
              return (
                <Card key={entry.id} className="border-border/50 flex flex-col">
                  <CardHeader>
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>
                      {isMyNote
                        ? "Sua Anotação Privada"
                        : "Anotação Pública do Mestre"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {entry.content || "Clique para editar"}
                    </p>
                  </CardContent>
                  {/* Só pode editar/excluir se a nota for sua */}
                  {isMyNote && (
                    <CardFooter className="flex justify-end items-center gap-2">
                      <JournalEntryDialog
                        tableId={tableId}
                        onEntrySaved={loadData}
                        entry={entry}
                        isPlayerNote={true} // <-- Diz ao diálogo que é um jogador
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
                    </CardFooter>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
      {/* --- FIM DA NOVA SEÇÃO --- */}

      {/* AlertDialog para Ficha (Sem alteração) */}
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
      
      {/* --- NOVO: AlertDialog para Diário --- */}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              A anotação "{entryToDelete?.title}" será removida permanentemente.
              Esta ação não pode ser desfeita.
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
      {/* --- FIM DO NOVO ALERTDIALOG --- */}
    </div>
  );
};