// src/components/MasterView.tsx

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";

import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab"; // <-- Importado

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("characters");

  // Realtime para atualizações gerais
  useEffect(() => {
    const channel = supabase
      .channel(`master-view-updates:${tableId}`)
      .on("postgres_changes", { event: "*", schema: "public", filter: `table_id=eq.${tableId}` }, (payload) => {
         const table = payload.table;
         if (['characters', 'character_folders'].includes(table)) queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
         if (['npcs', 'npc_folders'].includes(table)) queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
         if (['journal_entries', 'journal_folders'].includes(table)) queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableId, queryClient]);

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
        
        {/* Aba de Jogadores Extraída */}
        <TabsContent value="players">
            <MasterPlayersTab tableId={tableId} />
        </TabsContent>

        <TabsContent value="journal"><MasterJournalTab tableId={tableId} /></TabsContent>
      </Tabs>
    </div>
  );
};