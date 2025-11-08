import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MasterViewProps {
  tableId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [tableId]);

  const loadData = async () => {
    const [charsRes, npcsRes, membersRes] = await Promise.all([
      supabase.from("characters").select("*, player:profiles!characters_player_id_fkey(display_name)").eq("table_id", tableId),
      supabase.from("npcs").select("*").eq("table_id", tableId),
      supabase.from("table_members").select("*, user:profiles!table_members_user_id_fkey(display_name)").eq("table_id", tableId),
    ]);

    if (charsRes.data) setCharacters(charsRes.data);
    if (npcsRes.data) setNpcs(npcsRes.data);
    if (membersRes.data) setMembers(membersRes.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Mestre</h2>
        <p className="text-muted-foreground">Controle total sobre a mesa</p>
      </div>

      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Fichas dos Jogadores</h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Ficha
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {characters.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum personagem criado ainda
              </p>
            ) : (
              characters.map((char) => (
                <Card key={char.id} className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{char.name}</CardTitle>
                    <CardDescription>Jogador: {char.player.display_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Clique para ver detalhes</p>
                  </CardContent>
                </Card>
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
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{member.user.display_name}</span>
                    <span className="text-sm text-muted-foreground">
                      Entrou em {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
