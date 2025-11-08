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
import { Plus, Trash2 } from "lucide-react";
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

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [characterToDelete, setCharacterToDelete] = useState<MyCharacter | null>(null);

  useEffect(() => {
    loadData();

    const characterChannel = supabase
      .channel(`character-player:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(characterChannel);
    };
  }, [tableId]);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*, player:profiles!characters_player_id_fkey(display_name)")
        .eq("table_id", tableId)
        .eq("player_id", user.id); 
      
      if (error) throw error;
      setMyCharacters((data as any) || []);
    } catch (error: any) {
      console.error("Erro ao carregar fichas de personagem:", error.message);
      toast({
        title: "Erro ao carregar fichas",
        description: "Houve um problema ao buscar suas fichas.",
        variant: "destructive"
      });
      setMyCharacters([]);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem</p>
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
      
    </div>
  );
};