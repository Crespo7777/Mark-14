// src/components/MasterView.tsx

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { Store } from "lucide-react"; // Ícone para Lojas

// Importação das Abas
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab"; // <-- NOVA IMPORTAÇÃO

import { useTableRealtime } from "@/hooks/useTableRealtime";

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const [activeTab, setActiveTab] = useState("characters");

  // ✅ ATIVA O REALTIME GLOBAL PARA O MESTRE
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
        {/* Ajustado para grid-cols-5 para caber a nova aba */}
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="journal">Diário</TabsTrigger>
          <TabsTrigger value="shops" className="flex items-center gap-2">
             <Store className="w-4 h-4" /> Lojas & Loot
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
            <TabsContent value="characters"><MasterCharactersTab tableId={tableId} /></TabsContent>
            <TabsContent value="npcs"><MasterNpcsTab tableId={tableId} /></TabsContent>
            <TabsContent value="players"><MasterPlayersTab tableId={tableId} /></TabsContent>
            <TabsContent value="journal"><MasterJournalTab tableId={tableId} /></TabsContent>
            {/* Nova Aba de Lojas */}
            <TabsContent value="shops"><MasterShopsTab tableId={tableId} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};