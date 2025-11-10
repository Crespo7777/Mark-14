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
import { Plus, Trash2, BookOpen, Edit, Users } from "lucide-react"; // --- 1. Importar 'Users'
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
import { Database } from "@/integrations/supabase/types"; 
import { JournalEntryDialog } from "./JournalEntryDialog"; 
import { Separator } from "@/components/ui/separator"; 
import { JournalRenderer } from "./JournalRenderer";

// --- 2. Importar o NpcSheetSheet ---
import { NpcSheetSheet } from "@/features/npc/NpcSheetSheet"; 

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

// --- 3. Definir o tipo para NPC e Journal ---
type Npc = Database["public"]["Tables"]["npcs"]["Row"];
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];
// --- FIM DA ADIÇÃO ---

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [characterToDelete, setCharacterToDelete] = useState<MyCharacter | null>(
    null,
  );
  
  // --- 4. Novos estados para NPCs e Diário ---
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [sharedNpcs, setSharedNpcs] = useState<Npc[]>([]); // <-- NOVO ESTADO
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  // --- FIM DA ADIÇÃO ---

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`player-view:${tableId}`) 
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
      // --- 5. Adicionar listener para NPCs ---
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "npcs",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => loadData(), // Recarrega tudo se um NPC mudar
      )
      // --- FIM DA ADIÇÃO ---
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  // --- 6. Atualizar loadData para buscar NPCs ---
  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    try {
      const [charsRes, journalRes, npcsRes] = await Promise.all([
        // 1. Minhas Fichas
        supabase
          .from("characters")
          .select("*, player:profiles!characters_player_id_fkey(display_name)")
          .eq("table_id", tableId)
          .eq("player_id", user.id),
        
        // 2. Diário (Público do Mestre + Meu Privado)
        supabase
          .from("journal_entries")
          .select("*")
          .eq("table_id", tableId)
          .or(`is_shared=eq.true,player_id=eq.${user.id}`) // Apenas compartilhados OU meus
          .order("created_at", { ascending: false }),

        // 3. NPCs (Apenas compartilhados)
        supabase
          .from("npcs")
          .select("*")
          .eq("table_id", tableId)
          .eq("is_shared", true) // <-- SÓ BUSCA OS COMPARTILHADOS
          .order("name", { ascending: true }),
      ]);

      if (charsRes.error) throw charsRes.error;
      setMyCharacters((charsRes.data as any) || []);

      if (journalRes.error) throw journalRes.error;
      setJournalEntries(journalRes.data || []);
      
      if (npcsRes.error) throw npcsRes.error;
      setSharedNpcs(npcsRes.data || []); // <-- Define o estado dos NPCs

    } catch (error: any) {
      console.error("Erro ao carregar dados do jogador:", error.message);
      toast({
        title: "Erro ao carregar dados",
        description: "Houve um problema ao buscar seus dados.",
        variant: "destructive",
      });
      setMyCharacters([]);
      setJournalEntries([]);
      setSharedNpcs([]); // Limpa em caso de erro
    }
  };
  // --- FIM DA ATUALIZAÇÃO ---

  const handleDeleteCharacter = async () => {
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

  const handleDeleteJournalEntry = async () => {
    if (!entryToDelete) return;
    
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

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

      {/* --- 7. NOVA SEÇÃO: NPCs COMPARTILHADOS --- */}
      <div className="space-y-4">
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
              // O NpcSheetSheet cuida de abrir a ficha correta
              <NpcSheetSheet key={npc.id} npcId={npc.id}>
                <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer flex flex-col">
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
            ))
          )}
        </div>
      </div>
      {/* --- FIM DA NOVA SEÇÃO --- */}


      <Separator />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Diário & Anotações</h3>
          <JournalEntryDialog
            tableId={tableId}
            onEntrySaved={loadData}
            isPlayerNote={true}
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
                    <JournalRenderer content={entry.content} />
                  </CardContent>
                  {isMyNote && (
                    <CardFooter className="flex justify-end items-center gap-2">
                      <JournalEntryDialog
                        tableId={tableId}
                        onEntrySaved={loadData}
                        entry={entry}
                        isPlayerNote={true}
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

      {/* ... (AlertDialogs para deletar personagem e diário permanecem os mesmos) ... */}
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
    </div>
  );
};