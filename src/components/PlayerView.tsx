// src/components/PlayerView.tsx

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSquare, Users, BookOpen, ShoppingBag } from "lucide-react"; // Ícone ShoppingBag
import { useTableContext } from "@/features/table/TableContext";

// Importação das Abas
import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab"; // <-- NOVA IMPORTAÇÃO

import { useTableRealtime } from "@/hooks/useTableRealtime";

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const [activeTab, setActiveTab] = useState("characters");
  
  // ✅ ATIVA O REALTIME GLOBAL PARA O JOGADOR
  useTableRealtime(tableId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

      <Tabs defaultValue="characters" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        {/* Ajustado para grid-cols-4 para caber a nova aba */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="characters"><UserSquare className="w-4 h-4 mr-2" /> Fichas</TabsTrigger>
          <TabsTrigger value="npcs"><Users className="w-4 h-4 mr-2" /> NPCs</TabsTrigger>
          <TabsTrigger value="journal"><BookOpen className="w-4 h-4 mr-2" /> Diário</TabsTrigger>
          <TabsTrigger value="shops"><ShoppingBag className="w-4 h-4 mr-2" /> Mercado</TabsTrigger>
        </TabsList>

        <div className="mt-4">
            <TabsContent value="characters">
                {userId && <PlayerCharactersTab tableId={tableId} userId={userId} />}
            </TabsContent>

            <TabsContent value="npcs">
                <PlayerNpcsTab tableId={tableId} />
            </TabsContent>

            <TabsContent value="journal">
                {userId && <PlayerJournalTab tableId={tableId} userId={userId} />}
            </TabsContent>

            {/* Nova Aba de Mercado */}
            <TabsContent value="shops">
                {userId && <PlayerShopsTab tableId={tableId} userId={userId} />}
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};