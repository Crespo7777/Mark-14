// src/components/PlayerView.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

import { useTableContext } from "@/features/table/TableContext";
import { useTableRealtime } from "@/hooks/useTableRealtime";

// REMOVIDO: import { DiscordSettingsDialog } ...

import { PlayerSidebar } from "@/features/player/PlayerSidebar";

import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { PlayerRulesTab } from "@/features/player/PlayerRulesTab";
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab";

export const PlayerView = () => {
  const navigate = useNavigate();
  
  // Pega tableId E userId do contexto
  const { tableId, userId } = useTableContext(); 
  
  const [activeTab, setActiveTab] = useState("characters");

  useTableRealtime(tableId);

  const renderTabContent = () => {
    if (!userId) return <div className="p-4">Carregando perfil...</div>;
    switch (activeTab) {
      case "characters": return <PlayerCharactersTab tableId={tableId} userId={userId} />;
      case "npcs": return <PlayerNpcsTab tableId={tableId} />;
      case "journal": return <PlayerJournalTab tableId={tableId} userId={userId} />;
      case "shops": return <PlayerShopsTab tableId={tableId} userId={userId} />;
      case "rules": return <PlayerRulesTab tableId={tableId} />;
      default: return <PlayerCharactersTab tableId={tableId} userId={userId} />;
    }
  };

  const getPageTitle = () => {
      const titles: Record<string, string> = {
          characters: "Meus Personagens", npcs: "NPCs & Aliados", journal: "Diário",
          shops: "Mercado", rules: "Regras"
      };
      return titles[activeTab] || "Personagens";
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <PlayerSidebar currentTab={activeTab} onTabChange={setActiveTab} tableId={tableId} />
        
        <SidebarInset className="flex flex-col overflow-hidden h-full w-full">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h2 className="text-sm font-semibold">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
                {/* REMOVIDO: O botão do Discord estava aqui */}
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/10 p-4 relative">
              <div className="mx-auto max-w-full h-full flex flex-col">
                {renderTabContent()}
              </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};