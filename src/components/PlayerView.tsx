import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [sharedNpcs, setSharedNpcs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [tableId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [charsRes, npcsRes] = await Promise.all([
      supabase.from("characters").select("*").eq("table_id", tableId).eq("player_id", user.id),
      supabase.from("npcs").select("*").eq("table_id", tableId).eq("is_shared", true),
    ]);

    if (charsRes.data) setMyCharacters(charsRes.data);
    if (npcsRes.data) setSharedNpcs(npcsRes.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Meus Personagens</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Minhas Fichas</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Ficha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {myCharacters.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Você ainda não criou nenhum personagem. Clique em "Nova Ficha" para começar!
            </p>
          ) : (
            myCharacters.map((char) => (
              <Card key={char.id} className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{char.name}</CardTitle>
                  <CardDescription>Clique para editar</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Criado em {new Date(char.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {sharedNpcs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            NPCs Compartilhados
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {sharedNpcs.map((npc) => (
              <Card key={npc.id} className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{npc.name}</CardTitle>
                  <CardDescription>Compartilhado pelo mestre</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Apenas visualização</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
