// src/features/map/MapBoard.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { KonvaEventObject } from "konva/lib/Node";
import { GripHorizontal, X } from "lucide-react"; 

import { MapGrid } from "./MapGrid";
import { TokenHUD } from "./TokenHUD"; 
import { MapContextMenu } from "./MapContextMenu";
import { FogLayer } from "./FogLayer"; 
import { PingLayer, PingData } from "./PingLayer"; 
import { MapControls } from "./MapControls";
import { TokenLayer } from "./components/TokenLayer";
import { InteractionLayer } from "./components/InteractionLayer";
import { CombatTracker } from "@/features/combat/CombatTracker";

import { useTableContext } from "@/features/table/TableContext"; 
import { supabase } from "@/integrations/supabase/client"; 
import { useQueryClient } from "@tanstack/react-query";
import { useMapStage } from "./hooks/useMapStage";
import { useMapInteractions } from "./hooks/useMapInteractions";
import { useMapFocus } from "./hooks/useMapFocus";

import { Table } from "@/types/app-types";
import { MapToken as MapTokenType } from "@/types/map-types";

interface MapBoardProps {
  width?: number;
  height?: number;
  isMaster?: boolean;
  tableData: Table;
}

const BackgroundImage = ({ url, width, height }: { url: string | null, width: number, height: number }) => {
    const [image] = useImage(url || "", "anonymous");
    if (!url || !image) return <Rect width={width} height={height} fill="#18181b" />;
    return <KonvaImage image={image} />;
};

export const MapBoard = ({ width = window.innerWidth, height = window.innerHeight, isMaster = false, tableData }: MapBoardProps) => {
  const { tableId, mapTokens, setMapTokens, fogShapes, userId } = useTableContext();
  const queryClient = useQueryClient();
  const stageRef = useRef<any>(null);
  
  const gridSize = tableData.map_grid_size || 50; 
  const gridOpacity = tableData.map_grid_opacity ?? 0.2;
  const backgroundUrl = tableData.map_background_url;
  const isFogEnabled = tableData.map_fog_enabled || false; 

  const { stagePos, setStagePos, stageScale, setStageScale, handleWheel } = useMapStage();
  useMapFocus({ setStagePos, setStageScale, width, height });

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [tokenHudState, setTokenHudState] = useState<{ token: MapTokenType, x: number, y: number } | null>(null);
  const [bgMenuState, setBgMenuState] = useState<{ x: number, y: number } | null>(null); 
  const [activeTool, setActiveTool] = useState("select");
  const [pings, setPings] = useState<PingData[]>([]);
  
  // --- COMBAT TRACKER (Largura Ajustada e Posição Inicial) ---
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [combatPos, setCombatPos] = useState({ x: window.innerWidth - 320, y: 70 });
  const isDraggingCombat = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent) => {
      isDraggingCombat.current = true;
      dragOffset.current = {
          x: e.clientX - combatPos.x,
          y: e.clientY - combatPos.y
      };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDraggingCombat.current) {
              setCombatPos({
                  x: e.clientX - dragOffset.current.x,
                  y: e.clientY - dragOffset.current.y
              });
          }
      };
      const handleMouseUp = () => {
          isDraggingCombat.current = false;
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, []);

  const addPing = useCallback((newPing: PingData) => {
    setPings(prev => [...prev, newPing]);
  }, []);

  const removePing = useCallback((id: string) => {
    setPings(prev => prev.filter(p => p.id !== id));
  }, []);

  const sendPing = async (x: number, y: number) => {
    const color = isMaster ? "#FFD700" : "#ffffff"; 
    const newPing: PingData = {
        id: crypto.randomUUID(), x, y, color, user: userId
    };
    addPing(newPing);
    await supabase.channel(`room:${tableId}`).send({
        type: 'broadcast', event: 'cursor-ping', payload: newPing
    });
  };

  useEffect(() => {
    const channel = supabase.channel(`room:${tableId}`);
    channel.on('broadcast', { event: 'cursor-ping' }, (payload) => addPing(payload.payload)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableId, addPing]);

  useEffect(() => {
      if (!isFogEnabled && activeTool === "reveal") setActiveTool("select");
  }, [isFogEnabled, activeTool]);

  const closeAllMenus = () => {
      setTokenHudState(null);
      setBgMenuState(null);
  };

  // --- FUNÇÃO DE MOVIMENTO CORRIGIDA ---
  const executeTokenMove = async (token: MapTokenType, x: number, y: number) => {
    // 1. Atualiza o estado local (MapContext) para feedback imediato no canvas
    setMapTokens(prev => prev.map(t => t.id === token.id ? { ...t, x, y } : t));

    // 2. Atualiza a Cache do React Query (CRÍTICO para o TokenHUD não usar dados velhos)
    queryClient.setQueryData<MapTokenType[]>(["map_tokens", tableId], (old) => {
        if (!old) return [];
        return old.map(t => t.id === token.id ? { ...t, x, y } : t);
    });

    // 3. Atualiza o Banco de Dados
    const { error } = await supabase.from("map_tokens").update({ x, y }).eq("id", token.id).eq("table_id", tableId);
    
    if (error) {
      console.error("Erro token:", error);
      // Em caso de erro, revalida para voltar à posição do servidor
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    }
  };

  const handleCreateFog = async (points: number[]) => {
      const { error } = await supabase.from("map_fog").insert({ table_id: tableId, points, type: "reveal" });
      if (error) console.error("Erro fog:", error);
      else queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] });
  };

  const { interactionHandlers, interactionState, actions } = useMapInteractions({
      stageRef, activeTool, gridSize, isMaster,
      callbacks: {
          onPing: sendPing,
          onFogCreate: handleCreateFog,
          onMoveConfirm: executeTokenMove,
          onSelectToken: setSelectedTokenId,
          onCloseMenus: closeAllMenus
      }
  });

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const characterId = e.dataTransfer.getData("characterId");
    const label = e.dataTransfer.getData("label");
    const type = e.dataTransfer.getData("type"); 
    if (!characterId) return;

    const stage = stageRef.current;
    if (!stage) return;
    stage.setPointersPositions(e);
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const rawX = (pointer.x - stage.x()) / stage.scaleX();
    const rawY = (pointer.y - stage.y()) / stage.scaleY();
    const x = Math.round(rawX / gridSize) * gridSize;
    const y = Math.round(rawY / gridSize) * gridSize;

    const { error } = await supabase.from("map_tokens").insert({
        table_id: tableId, character_id: characterId, type, label, x, y, size: 1, color: "#ffffff"
    });
    if (!error) queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
  };

  const handleTokenContextMenu = (e: KonvaEventObject<PointerEvent>, token: MapTokenType) => {
      e.evt.preventDefault();
      e.cancelBubble = true; 
      if (interactionState.movePlan) { actions.setMovePlan(null); return; }
      setBgMenuState(null); 
      setTokenHudState({ token, x: e.evt.clientX, y: e.evt.clientY });
  };

  const handleStageContextMenu = (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (interactionState.movePlan) { actions.setMovePlan(null); return; }
      if (isMaster) {
          setTokenHudState(null); 
          setBgMenuState({ x: e.evt.clientX, y: e.evt.clientY });
      }
  };

  return (
    <div 
        className="w-full h-full bg-[#1a1a1a] overflow-hidden relative"
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} 
        onClick={closeAllMenus} onContextMenu={(e) => e.preventDefault()} 
    >
      <MapControls 
          tableData={tableData} 
          activeTool={activeTool} 
          onToolChange={setActiveTool} 
          isCombatOpen={isCombatOpen}
          onToggleCombat={() => setIsCombatOpen(!isCombatOpen)}
      />

      {isCombatOpen && (
          <div 
            className="absolute z-40 w-72 flex flex-col pointer-events-auto bg-card border border-border/50 rounded-md shadow-2xl overflow-hidden"
            style={{ 
                left: combatPos.x, 
                top: combatPos.y,
                maxHeight: 'calc(100vh - 120px)' 
            }}
          >
              <div 
                className="bg-muted/90 p-1.5 flex items-center justify-between cursor-move select-none border-b"
                onMouseDown={handleDragStart}
              >
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <GripHorizontal className="w-3 h-3" />
                      Combate
                  </div>
                  <button onClick={() => setIsCombatOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                  </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col h-[400px]">
                  <CombatTracker />
              </div>
          </div>
      )}

      <Stage
        width={width} height={height}
        draggable={activeTool === "select" && !interactionState.movePlan}
        onWheel={handleWheel}
        scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
        ref={stageRef}
        className={(activeTool !== "select" || interactionState.movePlan) ? "cursor-crosshair bg-black" : "cursor-move bg-black"}
        onDragEnd={(e) => { if (e.target === e.target.getStage()) setStagePos({ x: e.target.x(), y: e.target.y() }); }}
        onMouseDown={interactionHandlers.onMouseDown}
        onMouseMove={interactionHandlers.onMouseMove}
        onMouseUp={interactionHandlers.onMouseUp}
        onContextMenu={handleStageContextMenu}
      >
        <Layer>
            <BackgroundImage url={backgroundUrl} width={2000} height={2000} />
        </Layer>
        <Layer opacity={gridOpacity}> 
            <MapGrid width={4000} height={4000} gridSize={gridSize} />
        </Layer>
        <TokenLayer 
            tokens={mapTokens} gridSize={gridSize} isMaster={isMaster} activeTool={activeTool}
            movingTokenId={interactionState.movePlan?.token.id} selectedTokenId={selectedTokenId}
            onDragEnd={(id, x, y) => { const t = mapTokens.find(mt => mt.id === id); if(t) executeTokenMove(t, x, y); }}
            onSelect={setSelectedTokenId} onContextMenu={handleTokenContextMenu}
        />
        <FogLayer width={4000} height={4000} shapes={fogShapes} visible={isFogEnabled} opacity={isMaster ? 0.7 : 1} />
        <InteractionLayer state={interactionState} gridSize={gridSize} isMaster={isMaster} />
        <PingLayer pings={pings} onComplete={removePing} />
      </Stage>

      {tokenHudState && isMaster && (
          <TokenHUD 
              tokenId={tokenHudState.token.id} 
              position={{ x: tokenHudState.x, y: tokenHudState.y }} 
              onClose={() => setTokenHudState(null)}
              onStartMove={() => actions.startMove(tokenHudState.token)} 
          />
      )}

      {bgMenuState && isMaster && (
          <MapContextMenu
              position={{ x: bgMenuState.x, y: bgMenuState.y }}
              tableId={tableId}
              fogEnabled={isFogEnabled}
              onClose={() => setBgMenuState(null)}
          />
      )}

      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs pointer-events-none select-none border border-white/10 flex gap-4">
        <span>Zoom: {Math.round(stageScale * 100)}%</span>
        <span>Tokens: {mapTokens.length}</span>
        {isFogEnabled && <span className="text-blue-400 font-bold">FOG ON</span>}
      </div>
    </div>
  );
};