// src/components/PlayerView.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSquare, Users, BookOpen } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";

import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("characters");
  
  // Realtime Global (Apenas para conteúdos)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`player-view:${tableId}:${userId}`)
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
  }, [tableId, userId, queryClient]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

      <Tabs defaultValue="characters" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="characters"><UserSquare className="w-4 h-4 mr-2" /> Fichas</TabsTrigger>
          <TabsTrigger value="npcs"><Users className="w-4 h-4 mr-2" /> NPCs</TabsTrigger>
          <TabsTrigger value="journal"><BookOpen className="w-4 h-4 mr-2" /> Diário</TabsTrigger>
        </TabsList>

        <TabsContent value="characters">
             {userId && <PlayerCharactersTab tableId={tableId} userId={userId} />}
        </TabsContent>

        <TabsContent value="npcs">
             <PlayerNpcsTab tableId={tableId} />
        </TabsContent>

        <TabsContent value="journal">
             {userId && <PlayerJournalTab tableId={tableId} userId={userId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};