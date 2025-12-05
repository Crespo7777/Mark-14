// src/components/MasterView.tsx

import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

import { MasterSidebar } from "@/features/master/MasterSidebar"; 
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";

// Tabs
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";
import { MasterRulesTab } from "@/features/master/MasterRulesTab";

// Hooks e Contexto
import { useTableRealtime } from "@/hooks/useTableRealtime";
import { useTableContext } from "@/features/table/TableContext"; // <--- IMPORTANTE

export const MasterView = () => { // <--- REMOVIDO PROPS
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("characters");

  // Pega o ID do contexto (Correção do erro undefined)
  const { tableId } = useTableContext(); 

  useTableRealtime(tableId);

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "characters": return <MasterCharactersTab tableId={tableId} />;
      case "npcs": return <MasterNpcsTab tableId={tableId} />;
      case "journal": return <MasterJournalTab tableId={tableId} />;
      case "shops": return <MasterShopsTab tableId={tableId} />;
      case "database": return <MasterDatabaseTab tableId={tableId} />;
      case "rules": return <MasterRulesTab tableId={tableId} />;
      case "players": return <MasterPlayersTab tableId={tableId} />;
      default: return <MasterCharactersTab tableId={tableId} />;
    }
  };

  const getPageTitle = () => {
      const titles: Record<string, string> = {
          characters: "Personagens", npcs: "Bestiário & NPCs", journal: "Diário",
          shops: "Mercado", database: "Base de Dados", rules: "Regras",
          players: "Jogadores"
      };
      return titles[activeTab] || "Campanha";
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <MasterSidebar currentTab={activeTab} onTabChange={setActiveTab} tableId={tableId} />
        
        <SidebarInset className="flex flex-col overflow-hidden h-full w-full">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h2 className="text-sm font-semibold">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
                <Suspense fallback={null}><DiscordSettingsDialog /></Suspense>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/10 p-4 relative">
              <div className="mx-auto max-w-full h-full flex flex-col">
                {renderDashboardContent()}
              </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};