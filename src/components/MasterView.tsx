// src/components/MasterView.tsx

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";

import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { useTableRealtime } from "@/hooks/useTableRealtime"; // <-- IMPORTADO

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const [activeTab, setActiveTab] = useState("characters");

  // ✅ ATIVA O REALTIME GLOBAL PARA O MESTRE
  // Isto substitui aquele useEffect enorme e complexo que tinhas antes
  useTableRealtime(tableId);

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
        <TabsContent value="players"><MasterPlayersTab tableId={tableId} /></TabsContent>
        <TabsContent value="journal"><MasterJournalTab tableId={tableId} /></TabsContent>
      </Tabs>
    </div>
  );
};