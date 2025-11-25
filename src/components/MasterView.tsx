// src/components/MasterView.tsx

import { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { 
  Store, 
  Clapperboard, 
  Database, 
  Maximize, 
  Minimize,
  UserSquare,
  Users,
  BookOpen,
  LogOut
} from "lucide-react";

import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterMediaTab } from "@/features/master/MasterMediaTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";

import { SceneBoard } from "@/features/map/SceneBoard";
import { VttGridBackground } from "@/components/VttGridBackground";
import { MasterSidebar } from "@/features/master/MasterSidebar";
import { MasterToolbar } from "@/features/master/MasterToolbar";
import { MasterRightPanel } from "@/features/master/MasterRightPanel";

import { useTableRealtime } from "@/hooks/useTableRealtime";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'dashboard' | 'immersive'>('dashboard');
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useTableRealtime(tableId);

  useEffect(() => {
      const fetchState = async () => {
          const { data } = await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).single();
          if (data) setActiveSceneId(data.current_scene_id);
      };
      fetchState();

      const channel = supabase.channel(`master-view-sync:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => setActiveSceneId(payload.new.current_scene_id))
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  const handleAddToken = async (type: 'npc'|'character', id: string) => {
      if (!activeSceneId) {
          toast({ title: "Sem Cena", description: "Ative ou crie uma cena primeiro.", variant: "destructive" });
          return;
      }
      const payload: any = {
         scene_id: activeSceneId,
         x: 50, y: 50, scale: 1,
         [type === 'npc' ? 'npc_id' : 'character_id']: id
      };
      const { error } = await supabase.from("scene_tokens").insert(payload);
      if (!error) toast({ title: "Token Adicionado", description: "Verifique o centro do mapa." });
  };

  // --- MODO DASHBOARD (Menu Principal) ---
  const TabContent = () => (
    <Tabs defaultValue="characters" className="w-full h-full flex flex-col">
        <div className="px-4 pt-2 border-b border-border/40 bg-muted/20">
            <TabsList className="grid w-full grid-cols-7 h-auto p-1 gap-1 bg-transparent">
                <TabsTrigger value="characters" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><UserSquare className="w-4 h-4"/> PCs</TabsTrigger>
                <TabsTrigger value="npcs" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Users className="w-4 h-4"/> NPCs</TabsTrigger>
                <TabsTrigger value="journal" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><BookOpen className="w-4 h-4"/> Diário</TabsTrigger>
                <TabsTrigger value="shops" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Store className="w-4 h-4"/> Lojas</TabsTrigger>
                <TabsTrigger value="database" className="text-xs flex-col gap-1 h-14 data-[state=active]:bg-background"><Database className="w-4 h-4"/> DB</TabsTrigger>
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
            <TabsContent value="media" className="mt-0 h-full"><MasterMediaTab tableId={tableId} /></TabsContent>
            <TabsContent value="players" className="mt-0 h-full"><MasterPlayersTab tableId={tableId} /></TabsContent>
        </div>
    </Tabs>
  );

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
             <TabContent />
        </div>
      </div>
    );
  }

  // --- MODO IMERSIVO (VTT) ---
  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans text-foreground">
        
        {/* === CAMADA 0: MAPA === */}
        <div className="absolute inset-0 z-0">
             <VttGridBackground>
                 <SceneBoard sceneId={activeSceneId} isMaster={true} />
             </VttGridBackground>
        </div>

        {/* === CAMADA 1: HUD SUPERIOR (Botões Painel/Cena) === */}
        {/* Z-Index 40: Abaixo dos painéis laterais (z-90), Acima do mapa (z-0) */}
        <div className="fixed top-4 left-4 z-40 flex gap-2 pointer-events-auto">
            <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black/80 text-white border-white/10 backdrop-blur-md shadow-lg hover:bg-white/20"
                onClick={() => setMode('dashboard')}
                title="Voltar ao Painel de Gestão"
            >
                <Minimize className="w-4 h-4 mr-2" /> Painel
            </Button>
            {!activeSceneId && (
                <div className="bg-destructive/80 text-white px-3 py-1 rounded-md text-xs flex items-center backdrop-blur-md border border-white/10 shadow-lg">
                    Sem Cena Ativa
                </div>
            )}
        </div>

        {/* === CAMADA 2: PAINÉIS LATERAIS (Deslizantes) === */}
        {/* Z-Index 50 para o container (que tem pointer-events-none) */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            
            {/* ESQUERDA: Sidebar de Gestão */}
            {/* Z-Index 90: Fica ACIMA do HUD quando abre */}
            <div 
                className={`
                    absolute top-0 left-0 bottom-0 w-[350px] 
                    transition-transform duration-300 ease-in-out pointer-events-auto
                    ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
                style={{ zIndex: 90 }} 
            >
                <MasterSidebar 
                    tableId={tableId} 
                    isOpen={isLeftSidebarOpen} 
                    setIsOpen={setIsLeftSidebarOpen} 
                    onAddToken={handleAddToken}
                />
            </div>

            {/* DIREITA: Chat */}
            {/* Z-Index 90: Fica ACIMA do HUD quando abre */}
            <div 
                className={`
                    absolute top-4 right-4 bottom-24 w-80 
                    transition-all duration-300 ease-in-out pointer-events-auto
                    ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}
                `}
                style={{ zIndex: 90 }}
            >
                 <MasterRightPanel tableId={tableId} onClose={() => setIsChatOpen(false)} />
            </div>
        </div>

        {/* === CAMADA 3: TOOLBAR (FIXED, NO FUNDO) === */}
        {/* Z-Index 60: Acima do HUD, Abaixo dos Painéis se eles a taparem */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex items-center gap-2 transition-transform hover:scale-105">
                    <MasterToolbar 
                    tableId={tableId}
                    isChatOpen={isChatOpen}
                    onToggleChat={() => setIsChatOpen(!isChatOpen)}
                    isSidebarOpen={isLeftSidebarOpen}
                    onToggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                    />
            </div>
        </div>
    </div>
  );
};