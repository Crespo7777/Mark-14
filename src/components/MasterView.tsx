import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { Store, Clapperboard, Database, Maximize, Minimize, UserSquare, Users, BookOpen, LogOut, MessageSquare, X, Book } from "lucide-react";

// Imports das tabs do Dashboard
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterMediaTab } from "@/features/master/MasterMediaTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";
import { MasterRulesTab } from "@/features/master/MasterRulesTab";

// Imports do VTT (Mesa Virtual)
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
import { ImmersiveOverlay } from "@/components/ImmersiveOverlay"; // <--- ESSENCIAL PARA O ÁUDIO

import { useTableRealtime } from "@/hooks/useTableRealtime";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

const MasterDashboardTabs = ({ tableId }: { tableId: string }) => (
    <Tabs defaultValue="characters" className="w-full h-full flex flex-col">
        <div className="px-4 pt-2 border-b border-border/40 bg-muted/20">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1 gap-1 bg-transparent">
                <TabsTrigger value="characters" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><UserSquare className="w-4 h-4"/> PCs</TabsTrigger>
                <TabsTrigger value="npcs" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Users className="w-4 h-4"/> NPCs</TabsTrigger>
                <TabsTrigger value="journal" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><BookOpen className="w-4 h-4"/> Diário</TabsTrigger>
                <TabsTrigger value="shops" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Store className="w-4 h-4"/> Lojas</TabsTrigger>
                <TabsTrigger value="database" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Database className="w-4 h-4"/> DB</TabsTrigger>
                <TabsTrigger value="rules" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Book className="w-4 h-4"/> Regras</TabsTrigger> 
                <TabsTrigger value="media" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Clapperboard className="w-4 h-4"/> Studio</TabsTrigger>
                <TabsTrigger value="players" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Users className="w-4 h-4"/> Jog.</TabsTrigger>
            </TabsList>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-background/50">
            <TabsContent value="characters" className="mt-0 h-full"><MasterCharactersTab tableId={tableId} /></TabsContent>
            <TabsContent value="npcs" className="mt-0 h-full"><MasterNpcsTab tableId={tableId} /></TabsContent>
            <TabsContent value="journal" className="mt-0 h-full"><MasterJournalTab tableId={tableId} /></TabsContent>
            <TabsContent value="shops" className="mt-0 h-full"><MasterShopsTab tableId={tableId} /></TabsContent>
            <TabsContent value="database" className="mt-0 h-full"><MasterDatabaseTab tableId={tableId} /></TabsContent>
            <TabsContent value="rules" className="mt-0 h-full"><MasterRulesTab tableId={tableId} /></TabsContent>
            <TabsContent value="media" className="mt-0 h-full"><MasterMediaTab tableId={tableId} /></TabsContent>
            <TabsContent value="players" className="mt-0 h-full"><MasterPlayersTab tableId={tableId} /></TabsContent>
        </div>
    </Tabs>
);

export const MasterView = ({ tableId }: MasterViewProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estado do Modo (Dashboard vs Imersivo) com Persistência
  const [mode, setMode] = useState<'dashboard' | 'immersive'>(() => {
      const saved = localStorage.getItem(`table-mode-${tableId}`);
      return (saved === 'immersive' || saved === 'dashboard') ? saved : 'dashboard';
  });

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  
  // Estados de Interface do VTT
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBardOpen, setIsBardOpen] = useState(false);
  const [isPriosOpen, setIsPriosOpen] = useState(false);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  
  // Estado para Visualizar Ficha (Acesso Rápido ou Dock)
  const [inspectingEntity, setInspectingEntity] = useState<{ type: 'character'|'npc', id: string, name: string } | null>(null);

  useTableRealtime(tableId);

  // Salvar preferência de modo
  useEffect(() => {
      localStorage.setItem(`table-mode-${tableId}`, mode);
  }, [mode, tableId]);

  useEffect(() => {
      // 1. Sincronizar Cena Ativa
      const fetchState = async () => {
          const { data } = await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).single();
          if (data) setActiveSceneId(data.current_scene_id);
      };
      fetchState();

      const channel = supabase.channel(`master-view-sync:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => setActiveSceneId(payload.new.current_scene_id))
        .subscribe();
        
      // 2. Listeners para os botões da Dock
      const handleToggleCombat = () => setIsCombatOpen(prev => !prev);
      const handleToggleSettings = () => setIsSettingsOpen(prev => !prev);
      const handleToggleBard = () => setIsBardOpen(prev => !prev);
      const handleTogglePrios = () => setIsPriosOpen(prev => !prev);
      const handleToggleMasterPanel = () => setIsMasterPanelOpen(prev => !prev);
      const handleToggleQuickAccess = () => setIsQuickAccessOpen(prev => !prev);
      
      document.addEventListener('toggle-combat-tracker', handleToggleCombat);
      document.addEventListener('toggle-vtt-settings', handleToggleSettings);
      document.addEventListener('toggle-bard-panel', handleToggleBard);
      document.addEventListener('toggle-prios-panel', handleTogglePrios);
      document.addEventListener('toggle-master-panel', handleToggleMasterPanel);
      document.addEventListener('toggle-quick-access', handleToggleQuickAccess);

      return () => { 
          supabase.removeChannel(channel); 
          document.removeEventListener('toggle-combat-tracker', handleToggleCombat);
          document.removeEventListener('toggle-vtt-settings', handleToggleSettings);
          document.removeEventListener('toggle-bard-panel', handleToggleBard);
          document.removeEventListener('toggle-prios-panel', handleTogglePrios);
          document.removeEventListener('toggle-master-panel', handleToggleMasterPanel);
          document.removeEventListener('toggle-quick-access', handleToggleQuickAccess);
      };
  }, [tableId]);

  if (mode === 'dashboard') {
    return (
      <div className="space-y-6 p-6 pb-20 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 bg-card p-6 rounded-xl border shadow-sm"> 
          <div>
              <h2 className="text-3xl font-bold tracking-tight">Painel do Mestre</h2>
              <p className="text-muted-foreground">Prepare a sessão ou entre no modo de jogo.</p>
          </div>
          <div className="flex gap-2 items-center">
              <Suspense fallback={<Button variant="outline" size="sm" disabled>Carregando...</Button>}>
                <DiscordSettingsDialog />
              </Suspense>
              <Button variant="outline" onClick={() => navigate("/dashboard")}><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
              <div className="h-8 w-px bg-border mx-2 hidden sm:block" />
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-glow font-bold px-6" onClick={() => setMode('immersive')}>
                <Maximize className="w-5 h-5 mr-2" /> Entrar na Mesa
              </Button>
          </div>
        </div>
        <div className="bg-card border rounded-xl shadow-sm min-h-[600px] overflow-hidden">
             <MasterDashboardTabs tableId={tableId} />
        </div>
      </div>
    );
  }

  // --- MODO IMERSIVO (VTT) ---
  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans text-foreground">
        
        {/* COMPONENTE DE ÁUDIO/VÍDEO (Invisível mas Funcional) */}
        {/* Isto garante que o Mestre ouve a música e vê as cutscenes */}
        <ImmersiveOverlay tableId={tableId} isMaster={true} />

        {/* MAPA */}
        <div className="absolute inset-0 z-0">
             <VttGridBackground>
                 <SceneBoard sceneId={activeSceneId} isMaster={true} />
             </VttGridBackground>
        </div>

        {/* HUD SUPERIOR */}
        <div className="fixed top-4 left-4 z-40 flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-black/80 text-white border-white/10 backdrop-blur-md shadow-lg hover:bg-white/20" onClick={() => setMode('dashboard')}>
                <Minimize className="w-4 h-4 mr-2" /> Painel
            </Button>
            {!activeSceneId && (
                <div className="bg-destructive/80 text-white px-3 py-1 rounded-md text-xs flex items-center backdrop-blur-md border border-white/10 shadow-lg">
                    Sem Cena Ativa
                </div>
            )}
        </div>

        <div className="fixed top-4 right-4 z-50 pointer-events-auto">
            <Button variant={isChatOpen ? "default" : "secondary"} size="icon" className="rounded-full shadow-xl h-10 w-10 border-2 border-black/20 bg-black/80 text-white hover:bg-white/20" onClick={() => setIsChatOpen(!isChatOpen)}>
                {isChatOpen ? <X className="w-4 h-4"/> : <MessageSquare className="w-4 h-4" />}
            </Button>
        </div>

        {/* --- JANELAS FLUTUANTES --- */}
        
        {/* 1. Combate (Canto Superior Esquerdo, abaixo do HUD) */}
        {isCombatOpen && (
            <div className="fixed top-16 left-4 z-40 pointer-events-auto animate-in slide-in-from-left-10 fade-in duration-300">
                 <CombatTracker tableId={tableId} />
            </div>
        )}
        
        {/* 2. Painéis de Multimédia (Canto Inferior Direito - Empilhados) */}
        <div className="fixed bottom-24 right-4 z-50 pointer-events-auto flex flex-col-reverse gap-4 items-end">
            
            {/* O BARDO */}
            {isBardOpen && (
                <div className="animate-in slide-in-from-right-10 fade-in duration-300 shadow-2xl rounded-xl">
                    <BardPanel tableId={tableId} onClose={() => setIsBardOpen(false)} />
                </div>
            )}

            {/* O PRIOS */}
            {isPriosOpen && (
                <div className="animate-in slide-in-from-right-10 fade-in duration-300 shadow-2xl rounded-xl">
                    <PriosPanel tableId={tableId} onClose={() => setIsPriosOpen(false)} />
                </div>
            )}
        </div>

        {/* 3. Acesso Rápido (Centro Inferior, acima da Dock) */}
        {isQuickAccessOpen && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
                <QuickAccessPanel tableId={tableId} onClose={() => setIsQuickAccessOpen(false)} onOpenSheet={(type, id, name) => setInspectingEntity({ type, id, name })} />
            </div>
        )}

        {/* DOCK (Barra Inferior) */}
        <VttDock 
            tableId={tableId} 
            onDragStart={(item) => console.log(item)} 
            onInspect={(item) => {
                if (item.type === 'npc' || item.type === 'character') {
                    setInspectingEntity({ type: item.type, id: item.id, name: item.name });
                }
            }}
        />

        {/* --- PAINÉIS LATERAIS E MODALS --- */}

        {/* Chat Lateral */}
        <div className={`fixed top-16 right-4 bottom-24 w-80 transition-all duration-300 ease-in-out pointer-events-auto ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`} style={{ zIndex: 90 }}>
             <MasterRightPanel tableId={tableId} onClose={() => setIsChatOpen(false)} />
        </div>

        {/* Painel de Gestão Fullscreen */}
        <MasterInGamePanel isOpen={isMasterPanelOpen} onClose={() => setIsMasterPanelOpen(false)} tableId={tableId} />

        {/* Visualizador de Fichas (Lateral) */}
        <SheetViewer 
            isOpen={!!inspectingEntity} 
            entity={inspectingEntity} 
            onClose={() => setInspectingEntity(null)} 
        />

        {/* Definições */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="bg-black/90 border-white/20 backdrop-blur-xl"><DialogHeader><DialogTitle>Definições da Mesa</DialogTitle></DialogHeader><div className="py-4"><DiscordSettingsDialog /></div></DialogContent>
        </Dialog>

    </div>
  );
};