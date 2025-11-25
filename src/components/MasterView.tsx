// src/components/MasterView.tsx

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiscordSettingsDialog } from "./DiscordSettingsDialog";
import { 
  Store, 
  Clapperboard, 
  Database, 
  Maximize, 
  Minimize,
  Menu,
  MessageSquare,
  Dices,
  X,
  UserSquare,
  Users,
  BookOpen
} from "lucide-react";

// Features (Componentes de Gestão)
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterPlayersTab } from "@/features/master/MasterPlayersTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterMediaTab } from "@/features/master/MasterMediaTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";
// MasterScenesTab removido daqui, pois agora vive apenas dentro da Mesa (Sidebar)

// Componentes do VTT (Modo Imersivo)
import { SceneBoard } from "@/features/map/SceneBoard";
import { ChatPanel } from "@/components/ChatPanel";
import { VttGridBackground } from "@/components/VttGridBackground";
import { MasterSidebar } from "@/features/master/MasterSidebar";
import { MasterToolbar } from "@/features/master/MasterToolbar";

import { useTableRealtime } from "@/hooks/useTableRealtime";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface MasterViewProps {
  tableId: string;
  masterId: string;
}

export const MasterView = ({ tableId }: MasterViewProps) => {
  const { toast } = useToast();

  // Estados de Navegação
  const [mode, setMode] = useState<'dashboard' | 'immersive'>('dashboard');
  
  // Estados do VTT
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useTableRealtime(tableId);

  // Sincronizar com GameState
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

  // Função para adicionar Token
  const handleAddToken = async (type: 'npc'|'character', id: string) => {
      if (!activeSceneId) {
          toast({ title: "Sem Cena", description: "Ative ou crie uma cena primeiro na Sidebar.", variant: "destructive" });
          return;
      }

      const payload: any = {
         scene_id: activeSceneId,
         x: 50, y: 50, scale: 1,
         [type === 'npc' ? 'npc_id' : 'character_id']: id
      };

      const { error } = await supabase.from("scene_tokens").insert(payload);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Token Adicionado", description: "Verifique o centro do mapa." });
  };


  // --- CONTEÚDO DAS ABAS (Dashboard) ---
  const TabContent = () => (
    // Mudámos o default para 'characters', já que 'maps' saiu daqui
    <Tabs defaultValue="characters" className="w-full h-full flex flex-col">
        <div className="px-4 pt-2 border-b border-border/40 bg-muted/20">
            {/* Grid ajustado para 7 colunas (removemos Mapas) */}
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


  // --- MODO 1: DASHBOARD (Gestão) ---
  if (mode === 'dashboard') {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-wrap justify-between items-center gap-4 bg-card p-6 rounded-xl border shadow-sm"> 
          <div>
              <h2 className="text-3xl font-bold tracking-tight">Painel do Mestre</h2>
              <p className="text-muted-foreground">Prepare a sessão ou entre no modo de jogo.</p>
          </div>
          <div className="flex gap-2 items-center">
              <Suspense fallback={<Button variant="outline" size="sm" disabled>Carregando...</Button>}>
                <DiscordSettingsDialog />
              </Suspense>
              
              <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white shadow-glow font-bold px-6"
                onClick={() => setMode('immersive')}
              >
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


  // --- MODO 2: VTT IMERSIVO (Mestre) ---
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700 z-50 font-sans text-foreground">
        
        {/* CAMADA 1: MAPA / GRID */}
        <VttGridBackground className="absolute inset-0 z-0">
             <SceneBoard sceneId={activeSceneId} isMaster={true} />
        </VttGridBackground>

        {/* CAMADA 2: HUD SUPERIOR */}
        <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between pointer-events-none">
             <div className="pointer-events-auto">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="opacity-70 hover:opacity-100 transition-opacity bg-black/60 text-white border border-white/10 backdrop-blur-sm shadow-lg"
                    onClick={() => setMode('dashboard')}
                >
                    <Minimize className="w-4 h-4 mr-2" /> Voltar ao Painel
                </Button>
             </div>

             {!activeSceneId && (
                 <div className="bg-black/60 text-white/70 px-4 py-1 rounded-full backdrop-blur-md border border-white/10 text-xs font-mono pointer-events-auto shadow-lg">
                     Nenhuma cena ativa. Use a Sidebar à esquerda para criar ou ativar uma cena.
                 </div>
             )}

             <div className="pointer-events-auto">
                {/* Botão Chat Flutuante Superior (Redundante com a Toolbar, mas útil se a toolbar estiver escondida) */}
             </div>
        </div>

        {/* CAMADA 3: SIDEBAR DE GESTÃO (Esquerda) - AQUI ESTÁ O CONTROLO DE MAPAS AGORA */}
        <MasterSidebar tableId={tableId} onAddToken={handleAddToken} />

        {/* CAMADA 4: DOCK INFERIOR (Menu Mestre + Toolbar) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl p-2 px-4 rounded-2xl border border-white/10 shadow-2xl transform transition-transform hover:scale-105">
                
                {/* Menu Principal */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-primary/20 hover:text-primary text-white transition-colors" title="Menu do Mestre">
                            <Menu className="w-7 h-7" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] sm:w-[600px] bg-background/95 backdrop-blur border-r-slate-800 p-0 z-[60]">
                         <SheetHeader className="p-4 pb-0 border-b bg-muted/30">
                             <SheetTitle>Ferramentas de Mestre</SheetTitle>
                             <SheetDescription>Gerencie a sessão, NPCs e Lojas aqui.</SheetDescription>
                         </SheetHeader>
                         <div className="h-full flex flex-col pb-10">
                            <div className="flex-1 overflow-hidden">
                                <TabContent />
                            </div>
                         </div>
                    </SheetContent>
                </Sheet>

                <div className="w-px h-8 bg-white/10 mx-1" />
                
                <MasterToolbar 
                    tableId={tableId} 
                    isChatOpen={isChatOpen} 
                    onToggleChat={() => setIsChatOpen(!isChatOpen)} 
                />

                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Atalho Rápido: Dados */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-12 w-12 rounded-xl hover:bg-accent/20 hover:text-accent text-white transition-colors"
                            onClick={() => setIsChatOpen(true)}
                        >
                            <Dices className="w-7 h-7" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>Rolar Dados</p></TooltipContent>
                </Tooltip>
            </div>
        </div>

        {/* CAMADA 5: CHAT FLUTUANTE */}
        <div 
            className={`absolute top-20 right-4 bottom-24 w-80 z-30 transition-all duration-300 ease-in-out transform ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}
        >
            <Card className="h-full shadow-2xl border-border/50 bg-black/90 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 rounded-xl">
                 {/* HEADER DO CHAT COM BOTÃO FECHAR */}
                 <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                    <span className="font-semibold text-sm text-white ml-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Chat da Mesa
                    </span>
                    <Button 
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10 text-white/70 hover:text-white"
                        onClick={() => setIsChatOpen(false)}
                        title="Minimizar Chat"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                 </div>
                 
                 <div className="flex-1 overflow-hidden">
                     <ChatPanel tableId={tableId} />
                 </div>
            </Card>
        </div>

    </div>
  );
};