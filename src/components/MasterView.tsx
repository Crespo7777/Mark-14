import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Maximize, Minimize, LogOut, MessageSquare, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { MasterSidebar } from "@/features/master/MasterSidebar"; 
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

// Tabs
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterMediaTab } from "@/features/master/MasterMediaTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";
import { MasterRulesTab } from "@/features/master/MasterRulesTab";

// VTT
import { SceneBoard } from "@/features/map/SceneBoard";
import { VttGridBackground } from "@/components/VttGridBackground";
import { MasterRightPanel } from "@/features/master/MasterRightPanel";
import { CombatTracker } from "@/features/combat/CombatTracker"; 
import { VttDock } from "@/features/vtt/VttDock"; 
import { BardPanel } from "@/features/vtt/BardPanel"; 
import { PriosPanel } from "@/features/vtt/PriosPanel"; 
import { MasterInGamePanel } from "@/features/vtt/MasterInGamePanel"; 
import { QuickAccessPanel } from "@/features/vtt/QuickAccessPanel"; 
import { SheetViewer } from "@/features/vtt/SheetViewer"; 
import { ImmersiveOverlay } from "@/components/ImmersiveOverlay"; 

import { useTableRealtime } from "@/hooks/useTableRealtime";
import { supabase } from "@/integrations/supabase/client";

interface MasterViewProps { tableId: string; masterId: string; }

export const MasterView = ({ tableId }: MasterViewProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'dashboard' | 'immersive'>(() => {
      const saved = localStorage.getItem(`table-mode-${tableId}`);
      return (saved === 'immersive' || saved === 'dashboard') ? saved : 'dashboard';
  });

  const [activeTab, setActiveTab] = useState("characters");
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  
  // VTT States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBardOpen, setIsBardOpen] = useState(false);
  const [isPriosOpen, setIsPriosOpen] = useState(false);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  
  // SheetViewer agora usado APENAS para inspeção via mapa/dock, não pela pesquisa
  const [inspectingEntity, setInspectingEntity] = useState<{ type: string, id: string, name: string } | null>(null);

  useTableRealtime(tableId);

  useEffect(() => { localStorage.setItem(`table-mode-${tableId}`, mode); }, [mode, tableId]);

  useEffect(() => {
      const fetchState = async () => {
          const { data, error } = await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).maybeSingle();
          if (data) setActiveSceneId(data.current_scene_id);
          else if (!error) await supabase.from("game_states").insert({ table_id: tableId });
      };
      fetchState();

      const channel = supabase.channel(`master-view-sync:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => setActiveSceneId(payload.new.current_scene_id))
        .subscribe();
        
      const handleToggleCombat = () => setIsCombatOpen(prev => !prev);
      const handleToggleSettings = () => setIsSettingsOpen(prev => !prev);
      const handleToggleBard = () => setIsBardOpen(prev => !prev);
      const handleTogglePrios = () => setIsPriosOpen(prev => !prev);
      const handleToggleMasterPanel = () => setIsMasterPanelOpen(prev => !prev);
      const handleToggleQuickAccess = () => setIsQuickAccessOpen(prev => !prev);
      
      // NOVA LÓGICA DE NAVEGAÇÃO
      const handleNavigation = (e: CustomEvent) => {
          const { type } = e.detail;
          if (mode === 'immersive') {
              // Se estiver no jogo, volta ao painel para mostrar o conteúdo (opcional, ou abre sheet)
              setMode('dashboard');
          }
          
          // Redireciona para a aba correta
          if (type === 'character') setActiveTab('characters');
          if (type === 'npc') setActiveTab('npcs');
          if (type === 'journal') setActiveTab('journal');
          if (type === 'shop') setActiveTab('shops');
          if (type === 'rule') setActiveTab('rules');
          if (type === 'item') setActiveTab('database'); // Mestre tem aba Database
      };

      document.addEventListener('toggle-combat-tracker', handleToggleCombat);
      document.addEventListener('toggle-vtt-settings', handleToggleSettings);
      document.addEventListener('toggle-bard-panel', handleToggleBard);
      document.addEventListener('toggle-prios-panel', handleTogglePrios);
      document.addEventListener('toggle-master-panel', handleToggleMasterPanel);
      document.addEventListener('toggle-quick-access', handleToggleQuickAccess);
      document.addEventListener('navigate-to-content', handleNavigation as EventListener);

      return () => { 
          supabase.removeChannel(channel); 
          document.removeEventListener('toggle-combat-tracker', handleToggleCombat);
          document.removeEventListener('toggle-vtt-settings', handleToggleSettings);
          document.removeEventListener('toggle-bard-panel', handleToggleBard);
          document.removeEventListener('toggle-prios-panel', handleTogglePrios);
          document.removeEventListener('toggle-master-panel', handleToggleMasterPanel);
          document.removeEventListener('toggle-quick-access', handleToggleQuickAccess);
          document.removeEventListener('navigate-to-content', handleNavigation as EventListener);
      };
  }, [tableId, mode]);

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "characters": return <MasterCharactersTab tableId={tableId} />;
      case "npcs": return <MasterNpcsTab tableId={tableId} />;
      case "journal": return <MasterJournalTab tableId={tableId} />;
      case "shops": return <MasterShopsTab tableId={tableId} />;
      case "database": return <MasterDatabaseTab tableId={tableId} />;
      case "rules": return <MasterRulesTab tableId={tableId} />;
      case "media": return <MasterMediaTab tableId={tableId} />;
      case "players": return <MasterPlayersTab tableId={tableId} />;
      default: return <MasterCharactersTab tableId={tableId} />;
    }
  };

  const getPageTitle = () => {
      const titles: Record<string, string> = {
          characters: "Personagens", npcs: "Bestiário & NPCs", journal: "Diário",
          shops: "Mercado", database: "Base de Dados", rules: "Regras",
          media: "Estúdio", players: "Jogadores"
      };
      return titles[activeTab] || "Campanha";
  };

  if (mode === 'dashboard') {
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
                 <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
                 <div className="h-6 w-px bg-border mx-1" />
                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => setMode('immersive')}><Maximize className="w-4 h-4 mr-2" /> VTT</Button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-muted/10 p-4 relative">
               <div className="mx-auto max-w-full h-full flex flex-col">{renderDashboardContent()}</div>
            </main>
          </SidebarInset>
          <SheetViewer isOpen={!!inspectingEntity} entity={inspectingEntity} onClose={() => setInspectingEntity(null)} />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans text-foreground">
        <div className="hidden"><GlobalSearchDialog tableId={tableId} /></div>
        <ImmersiveOverlay tableId={tableId} isMaster={true} />
        <div className="absolute inset-0 z-0"><VttGridBackground><SceneBoard sceneId={activeSceneId} isMaster={true} /></VttGridBackground></div>
        <div className="fixed top-4 left-4 z-40 flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-black/80 text-white border-white/10 backdrop-blur-md shadow-lg" onClick={() => setMode('dashboard')}><Minimize className="w-4 h-4 mr-2" /> Dashboard</Button>
            {!activeSceneId && <div className="bg-destructive/80 text-white px-3 py-1 rounded-md text-xs flex items-center backdrop-blur-md border border-white/10">Sem Cena Ativa</div>}
        </div>
        <div className="fixed top-4 right-4 z-50 pointer-events-auto">
            <Button variant={isChatOpen ? "default" : "secondary"} size="icon" className="rounded-full shadow-xl h-10 w-10 border-2 border-black/20 bg-black/80 text-white" onClick={() => setIsChatOpen(!isChatOpen)}>{isChatOpen ? <X className="w-4 h-4"/> : <MessageSquare className="w-4 h-4" />}</Button>
        </div>
        {isCombatOpen && <div className="fixed top-16 left-4 z-40 pointer-events-auto animate-in slide-in-from-left-10 fade-in duration-300"><CombatTracker tableId={tableId} /></div>}
        <div className="fixed bottom-24 right-4 z-50 pointer-events-auto flex flex-col-reverse gap-4 items-end">
            {isBardOpen && <div className="shadow-2xl rounded-xl"><BardPanel tableId={tableId} onClose={() => setIsBardOpen(false)} /></div>}
            {isPriosOpen && <div className="shadow-2xl rounded-xl"><PriosPanel tableId={tableId} onClose={() => setIsPriosOpen(false)} /></div>}
        </div>
        {isQuickAccessOpen && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300"><QuickAccessPanel tableId={tableId} onClose={() => setIsQuickAccessOpen(false)} onOpenSheet={(type, id, name) => setInspectingEntity({ type, id, name })} /></div>}
        <VttDock tableId={tableId} onDragStart={() => {}} onInspect={(item) => { if (item.type === 'npc' || item.type === 'character') { setInspectingEntity({ type: item.type, id: item.id, name: item.name }); } }} />
        <div className={`fixed top-16 right-4 bottom-24 w-80 transition-all duration-300 ease-in-out pointer-events-auto ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`} style={{ zIndex: 90 }}><MasterRightPanel tableId={tableId} onClose={() => setIsChatOpen(false)} /></div>
        <MasterInGamePanel isOpen={isMasterPanelOpen} onClose={() => setIsMasterPanelOpen(false)} tableId={tableId} />
        <SheetViewer isOpen={!!inspectingEntity} entity={inspectingEntity} onClose={() => setInspectingEntity(null)} />
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}><DialogContent className="bg-black/90 border-white/20 backdrop-blur-xl"><DialogHeader><DialogTitle>Definições</DialogTitle></DialogHeader><div className="py-4"><DiscordSettingsDialog /></div></DialogContent></Dialog>
    </div>
  );
};