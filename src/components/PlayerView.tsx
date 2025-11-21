// src/components/PlayerView.tsx

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSquare, Users, BookOpen, ShoppingBag } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

// Importação das Abas
import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab";

import { useTableRealtime } from "@/hooks/useTableRealtime";

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const [activeTab, setActiveTab] = useState("characters");
  const [shopsOpen, setShopsOpen] = useState(false); // Novo estado

  useTableRealtime(tableId);

  // Escutar se a loja está aberta globalmente
  useEffect(() => {
    const fetchTableSettings = async () => {
        const { data } = await supabase.from("tables").select("shops_open").eq("id", tableId).single();
        if (data) setShopsOpen(!!data.shops_open);
    };
    fetchTableSettings();

    const channel = supabase.channel(`table-settings:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` }, 
        (payload) => {
            const newSettings = payload.new as any;
            setShopsOpen(!!newSettings.shops_open);
            // Se a loja fechar e o jogador estiver nela, manda para a ficha
            if (!newSettings.shops_open && activeTab === 'shops') {
                setActiveTab("characters");
            }
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId, activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas de personagem e anotações</p>
      </div>

      <Tabs defaultValue="characters" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${shopsOpen ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="characters"><UserSquare className="w-4 h-4 mr-2" /> Fichas</TabsTrigger>
          <TabsTrigger value="npcs"><Users className="w-4 h-4 mr-2" /> NPCs</TabsTrigger>
          <TabsTrigger value="journal"><BookOpen className="w-4 h-4 mr-2" /> Diário</TabsTrigger>
          {shopsOpen && (
             <TabsTrigger value="shops"><ShoppingBag className="w-4 h-4 mr-2" /> Mercado</TabsTrigger>
          )}
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

            {shopsOpen && (
                <TabsContent value="shops">
                    {userId && <PlayerShopsTab tableId={tableId} userId={userId} />}
                </TabsContent>
            )}
        </div>
      </Tabs>
    </div>
  );
};