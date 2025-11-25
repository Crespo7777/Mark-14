// src/components/PlayerView.tsx

import { useState, useEffect } from "react";
import { useTableContext } from "@/features/table/TableContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserSquare, 
  MessageSquare, 
  Dices, 
  LogOut, 
  Menu, 
  X, 
  Users,
  ShoppingBag,
  BookOpen,
  Map as MapIcon,
  Maximize,
  Minimize
} from "lucide-react";

// Componentes
import { PlayerCharactersTab } from "@/features/player/PlayerCharactersTab";
import { PlayerNpcsTab } from "@/features/player/PlayerNpcsTab";
import { PlayerJournalTab } from "@/features/player/PlayerJournalTab";
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab";
import { SceneBoard } from "@/features/map/SceneBoard";
import { ChatPanel } from "@/components/ChatPanel";
import { CharacterSheetSheet } from "@/components/CharacterSheetSheet";
import { VttGridBackground } from "@/components/VttGridBackground";

// UI
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTableRealtime } from "@/hooks/useTableRealtime";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // <-- CORREÇÃO: Importação adicionada

interface PlayerViewProps {
  tableId: string;
}

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const { userId } = useTableContext();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [shopsOpen, setShopsOpen] = useState(false);
  
  // Estados de Navegação
  const [mode, setMode] = useState<'dashboard' | 'immersive'>('dashboard');
  
  // Estados do Modo Imersivo (Janelas)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  
  useTableRealtime(tableId);

  // 1. Setup Inicial e Listeners
  useEffect(() => {
    // Buscar estado da loja
    supabase.from("tables").select("shops_open").eq("id", tableId).single()
      .then(({ data }) => { if(data) setShopsOpen(!!data.shops_open); });

    // Buscar cena ativa
    supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).single()
      .then(({ data }) => { if(data) setActiveSceneId(data.current_scene_id); });

    // Buscar meu personagem principal (para atalho da ficha)
    if(userId) {
        supabase.from("characters").select("id").eq("table_id", tableId).eq("player_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => { if(data) setMyCharacterId(data.id); });
    }

    // Realtime Listener
    const channel = supabase.channel(`player-view:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` }, 
        (payload: any) => setShopsOpen(!!payload.new.shops_open))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => {
             setActiveSceneId(payload.new.current_scene_id);
             // Opcional: Se o mestre ativar uma cena, força a entrada no modo imersivo?
             // setMode('immersive'); // Descomente se quiser forçar
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [tableId, userId]);


  // --- RENDERIZAÇÃO: MODO DASHBOARD (Lobby) ---
  if (mode === 'dashboard') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Banner de Entrada na Mesa */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="space-y-2 text-center md:text-left">
                 <h2 className="text-3xl font-bold text-white flex items-center gap-3 justify-center md:justify-start">
                    <MapIcon className="w-8 h-8 text-green-500" /> 
                    Mesa Virtual
                 </h2>
                 <p className="text-slate-400 max-w-md">
                    Entre no modo imersivo para ver o mapa, mover seu token e interagir com o ambiente em tempo real.
                 </p>
             </div>
             <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-6 shadow-glow transition-all hover:scale-105"
                onClick={() => setMode('immersive')}
             >
                <Maximize className="w-5 h-5 mr-2" /> Entrar na Mesa
             </Button>
        </div>

        <Separator className="my-6" />

        <h3 className="text-xl font-semibold text-muted-foreground mb-4">Gestão & Consultas</h3>

        <Tabs defaultValue="characters" className="w-full">
            <TabsList className={`grid w-full ${shopsOpen ? "grid-cols-4" : "grid-cols-3"}`}>
                <TabsTrigger value="characters"><UserSquare className="w-4 h-4 mr-2" /> Fichas</TabsTrigger>
                <TabsTrigger value="npcs"><Users className="w-4 h-4 mr-2" /> NPCs</TabsTrigger>
                <TabsTrigger value="journal"><BookOpen className="w-4 h-4 mr-2" /> Diário</TabsTrigger>
                {shopsOpen && <TabsTrigger value="shops"><ShoppingBag className="w-4 h-4 mr-2" /> Mercado</TabsTrigger>}
            </TabsList>
            
            <div className="mt-4 min-h-[500px]">
                <TabsContent value="characters">{userId && <PlayerCharactersTab tableId={tableId} userId={userId} />}</TabsContent>
                <TabsContent value="npcs"><PlayerNpcsTab tableId={tableId} /></TabsContent>
                <TabsContent value="journal">{userId && <PlayerJournalTab tableId={tableId} userId={userId} />}</TabsContent>
                {shopsOpen && <TabsContent value="shops">{userId && <PlayerShopsTab tableId={tableId} userId={userId} />}</TabsContent>}
            </div>
        </Tabs>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: MODO IMERSIVO (VTT) ---
  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700 z-50">
        
        {/* CAMADA 1: FUNDO E MAPA */}
        <VttGridBackground className="absolute inset-0 z-0">
             {/* O SceneBoard gere o que mostra: Mapa se houver ID, ou vazio se null */}
             <SceneBoard sceneId={activeSceneId} isMaster={false} userId={userId || undefined} />
        </VttGridBackground>

        {/* CAMADA 2: HUD SUPERIOR */}
        <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between pointer-events-none">
             {/* Botão Sair (Canto Esquerdo) */}
             <div className="pointer-events-auto">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="opacity-50 hover:opacity-100 transition-opacity bg-black/60 text-white border border-white/10 backdrop-blur-sm"
                    onClick={() => setMode('dashboard')}
                >
                    <Minimize className="w-4 h-4 mr-2" /> Sair da Mesa
                </Button>
             </div>

             {/* Status do Mapa (Centro) */}
             {!activeSceneId && (
                 <div className="bg-black/60 text-white/70 px-4 py-1 rounded-full backdrop-blur-md border border-white/10 text-xs font-mono pointer-events-auto">
                     Aguardando mapa do Mestre...
                 </div>
             )}

             {/* Botão Chat (Canto Direito) */}
             <div className="pointer-events-auto">
                <Button 
                    variant={isChatOpen ? "default" : "secondary"} 
                    size="icon" 
                    className="rounded-full shadow-xl h-10 w-10 border-2 border-black/20"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    title="Chat / Dados"
                >
                    {isChatOpen ? <X className="w-4 h-4"/> : <MessageSquare className="w-4 h-4" />}
                </Button>
             </div>
        </div>

        {/* CAMADA 3: DOCK INFERIOR (Ferramentas) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl p-2 px-4 rounded-2xl border border-white/10 shadow-2xl transform transition-transform hover:scale-105">
                
                {/* Minha Ficha */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        {myCharacterId ? (
                            <CharacterSheetSheet characterId={myCharacterId}>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-primary/20 hover:text-primary text-white transition-colors">
                                    <UserSquare className="w-7 h-7" />
                                </Button>
                            </CharacterSheetSheet>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground opacity-50" disabled>
                                <UserSquare className="w-7 h-7" />
                            </Button>
                        )}
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>Minha Ficha</p></TooltipContent>
                </Tooltip>
                
                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Menu Geral (Diário, NPCs, Lojas) */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/10 text-white transition-colors">
                            <BookOpen className="w-7 h-7" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur border-r-slate-800 p-0">
                         <div className="h-full flex flex-col">
                            <div className="p-6 pb-2 border-b border-border/50">
                                <h2 className="text-2xl font-bold">Diário & Referências</h2>
                            </div>
                            <Tabs defaultValue="journal" className="flex-1 flex flex-col">
                                <div className="px-6 pt-4">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="journal">Diário</TabsTrigger>
                                        <TabsTrigger value="npcs">NPCs</TabsTrigger>
                                        {shopsOpen && <TabsTrigger value="shops">Mercado</TabsTrigger>}
                                    </TabsList>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    <TabsContent value="journal">{userId && <PlayerJournalTab tableId={tableId} userId={userId} />}</TabsContent>
                                    <TabsContent value="npcs"><PlayerNpcsTab tableId={tableId} /></TabsContent>
                                    {shopsOpen && <TabsContent value="shops">{userId && <PlayerShopsTab tableId={tableId} userId={userId} />}</TabsContent>}
                                </div>
                            </Tabs>
                         </div>
                    </SheetContent>
                </Sheet>

                {/* Atalho Dados */}
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

        {/* CAMADA 4: PAINEL LATERAL (Chat) */}
        <div 
            className={`absolute top-16 right-4 bottom-24 w-80 z-30 transition-all duration-300 ease-in-out transform ${isChatOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}
        >
            <Card className="h-full shadow-2xl border-border/50 bg-black/80 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 rounded-xl">
                 <div className="flex-1 overflow-hidden">
                     <ChatPanel tableId={tableId} />
                 </div>
            </Card>
        </div>

    </div>
  );
};