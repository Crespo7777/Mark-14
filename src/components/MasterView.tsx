// src/components/MasterView.tsx

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserX } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTableContext } from "@/features/table/TableContext";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";

import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const { members } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("characters");
  const [playerToRemove, setPlayerToRemove] = useState<any | null>(null);

  // Realtime APENAS para conteúdos de gestão (Chat é gerido no ChatPanel)
  useEffect(() => {
    const channel = supabase
      .channel(`master-view-updates:${tableId}`)
      .on("postgres_changes", { event: "*", schema: "public", filter: `table_id=eq.${tableId}` }, (payload) => {
         const table = payload.table;
         if (table === "characters" || table === "character_folders") queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
         if (table === "character_folders") queryClient.invalidateQueries({ queryKey: ['character_folders', tableId] });
         
         if (table === "npcs" || table === "npc_folders") queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
         if (table === "npc_folders") queryClient.invalidateQueries({ queryKey: ['npc_folders', tableId] });

         if (table === "journal_entries" || table === "journal_folders") queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
         if (table === "journal_folders") queryClient.invalidateQueries({ queryKey: ['journal_folders', tableId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableId, queryClient]);

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    const { error } = await supabase.from("table_members").delete().eq("table_id", tableId).eq("user_id", playerToRemove.id);
    if (!error) {
        await supabase.from("characters").delete().eq("table_id", tableId).eq("player_id", playerToRemove.id);
        toast({ title: "Jogador removido" });
        queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
    } else {
        toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
    setPlayerToRemove(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2"> 
          <h2 className="text-3xl font-bold">Painel do Mestre</h2>
          <Suspense fallback={<Button variant="outline" size="sm" disabled>Carregando...</Button>}>
            <DiscordSettingsDialog />
          </Suspense>
        </div>
        <p className="text-muted-foreground">Controle total sobre a mesa</p>
      </div>

      <Tabs defaultValue="characters" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="journal">Diário</TabsTrigger>
        </TabsList>
        
        <TabsContent value="characters"><MasterCharactersTab tableId={tableId} /></TabsContent>
        <TabsContent value="npcs"><MasterNpcsTab tableId={tableId} /></TabsContent>
        <TabsContent value="journal"><MasterJournalTab tableId={tableId} /></TabsContent>

        <TabsContent value="players" className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa</h3>
          {members.filter(m => !m.isMaster).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum jogador entrou na sua mesa ainda.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.filter(m => !m.isMaster).map((member) => (
                <Card key={member.id} className="border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{member.display_name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <CardTitle className="text-lg">{member.display_name}</CardTitle>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => setPlayerToRemove(member)}><UserX className="w-4 h-4" /></Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Jogador?</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que quer remover <span className="font-bold text-destructive">{playerToRemove?.display_name}</span>? 
                Todas as fichas deste jogador serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePlayer} className={buttonVariants({ variant: "destructive" })}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};