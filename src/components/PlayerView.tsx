import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Maximize, Minimize, LogOut, MessageSquare, X } from "lucide-react";

import { useTableContext } from "@/features/table/TableContext";
import { useTableRealtime } from "@/hooks/useTableRealtime";
import { supabase } from "@/integrations/supabase/client";

import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { PlayerSidebar } from "@/features/player/PlayerSidebar";

import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { PlayerRulesTab } from "@/features/player/PlayerRulesTab";
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab";

import { SceneBoard } from "@/features/map/SceneBoard";
import { VttGridBackground } from "@/components/VttGridBackground";
import { CombatTracker } from "@/features/combat/CombatTracker"; 
import { VttDock } from "@/features/vtt/VttDock"; 
import { QuickAccessPanel } from "@/features/vtt/QuickAccessPanel"; 
import { SheetViewer } from "@/features/vtt/SheetViewer"; 
import { ImmersiveOverlay } from "@/components/ImmersiveOverlay"; 
import { ChatPanel } from "@/components/ChatPanel";
import { Card } from "@/components/ui/card";

interface PlayerViewProps { tableId: string; }

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const navigate = useNavigate();
  const { userId } = useTableContext();
  
  const [mode, setMode] = useState<'dashboard' | 'immersive'>(() => {
      const saved = localStorage.getItem(`player-table-mode-${tableId}`);
      return (saved === 'immersive' || saved === 'dashboard') ? saved : 'dashboard';
  });
  
  const [activeTab, setActiveTab] = useState("characters");
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  
  // SheetViewer só para VTT agora
  const [inspectingEntity, setInspectingEntity] = useState<{ type: string, id: string, name: string } | null>(null);

  useTableRealtime(tableId);

  useEffect(() => { localStorage.setItem(`player-table-mode-${tableId}`, mode); }, [mode, tableId]);

  useEffect(() => {
      const fetchState = async () => {
          const { data } = await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).maybeSingle();
          if (data) setActiveSceneId(data.current_scene_id);
      };
      fetchState();

      const channel = supabase.channel(`player-view-sync:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => setActiveSceneId(payload.new.current_scene_id))
        .subscribe();
        
      const handleToggleCombat = () => setIsCombatOpen(prev => !prev);
      const handleToggleQuickAccess = () => setIsQuickAccessOpen(prev => !prev);
      
      // NOVA LÓGICA DE NAVEGAÇÃO PARA O JOGADOR
      const handleNavigation = (e: CustomEvent) => {
          const { type } = e.detail;
          if (mode === 'immersive') setMode('dashboard');

          if (type === 'character') setActiveTab('characters');
          if (type === 'npc') setActiveTab('npcs');
          if (type === 'journal') setActiveTab('journal');
          if (type === 'shop') setActiveTab('shops');
          if (type === 'rule') setActiveTab('rules');
          if (type === 'item') setActiveTab('shops'); // Jogador não tem DB, manda para Loja
      };
      
      document.addEventListener('toggle-combat-tracker', handleToggleCombat);
      document.addEventListener('toggle-quick-access', handleToggleQuickAccess);
      document.addEventListener('navigate-to-content', handleNavigation as EventListener);

      return () => { 
          supabase.removeChannel(channel); 
          document.removeEventListener('toggle-combat-tracker', handleToggleCombat);
          document.removeEventListener('toggle-quick-access', handleToggleQuickAccess);
          document.removeEventListener('navigate-to-content', handleNavigation as EventListener);
      };
  }, [tableId, mode]);

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

  if (mode === 'dashboard') {
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
                 <Suspense fallback={null}><DiscordSettingsDialog /></Suspense>
                 <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
                 <div className="h-6 w-px bg-border mx-1" />
                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => setMode('immersive')}><Maximize className="w-4 h-4 mr-2" /> Entrar na Mesa</Button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-muted/10 p-4 relative">
               <div className="mx-auto max-w-full h-full flex flex-col">{renderTabContent()}</div>
            </main>
          </SidebarInset>
          {/* SheetViewer mantido aqui apenas se o usuário clicar em algo que não seja da pesquisa (ex: links internos) */}
          <SheetViewer isOpen={!!inspectingEntity} entity={inspectingEntity} onClose={() => setInspectingEntity(null)} />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans text-foreground">
        <div className="hidden"><GlobalSearchDialog tableId={tableId} /></div>
        <ImmersiveOverlay tableId={tableId} isMaster={false} />
        <div className="absolute inset-0 z-0"><VttGridBackground><SceneBoard sceneId={activeSceneId} isMaster={false} userId={userId || undefined} /></VttGridBackground></div>
        <div className="fixed top-4 left-4 z-40 flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-black/80 text-white border-white/10 backdrop-blur-md shadow-lg" onClick={() => setMode('dashboard')}><Minimize className="w-4 h-4 mr-2" /> Fichas</Button>
            {!activeSceneId && <div className="bg-destructive/80 text-white px-3 py-1 rounded-md text-xs flex items-center backdrop-blur-md border border-white/10">Aguardando Mapa...</div>}
        </div>
        <div className="fixed top-4 right-4 z-50 pointer-events-auto">
             <Button variant={isChatOpen ? "default" : "secondary"} size="icon" className="rounded-full shadow-xl h-10 w-10 border-2 border-black/20 bg-black/80 text-white" onClick={() => setIsChatOpen(!isChatOpen)}>{isChatOpen ? <X className="w-4 h-4"/> : <MessageSquare className="w-4 h-4" />}</Button>
        </div>
        {isCombatOpen && <div className="fixed top-16 left-4 z-40 pointer-events-auto animate-in slide-in-from-left-10 fade-in duration-300"><CombatTracker tableId={tableId} /></div>}
        <div className={`fixed top-16 right-4 bottom-24 w-80 z-30 transition-all duration-300 ease-in-out transform pointer-events-auto ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}><Card className="h-full shadow-2xl border-border/50 bg-black/80 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 rounded-xl"><div className="flex-1 overflow-hidden"><ChatPanel tableId={tableId} /></div></Card></div>
        {isQuickAccessOpen && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300"><QuickAccessPanel tableId={tableId} onClose={() => setIsQuickAccessOpen(false)} onOpenSheet={(type, id, name) => setInspectingEntity({ type, id, name })} /></div>}
        <VttDock tableId={tableId} onDragStart={() => {}} onInspect={(item) => { if (item.type === 'npc' || item.type === 'character') { setInspectingEntity({ type: item.type, id: item.id, name: item.name }); } }} />
        <SheetViewer isOpen={!!inspectingEntity} entity={inspectingEntity} onClose={() => setInspectingEntity(null)} />
    </div>
  );
};