// src/components/PlayerView.tsx

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSquare, Users, BookOpen } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";

import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { useTableRealtime } from "@/hooks/useTableRealtime"; // <-- IMPORTADO

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const [activeTab, setActiveTab] = useState("characters");
  
  // ✅ ATIVA O REALTIME GLOBAL PARA O JOGADOR
  // Garante que se o Mestre partilhar algo, aparece logo aqui.
  useTableRealtime(tableId);

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