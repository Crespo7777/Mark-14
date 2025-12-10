import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Line, Text, Group } from "react-konva";
import useImage from "use-image";
import { KonvaEventObject } from "konva/lib/Node";
import { MapGrid } from "./MapGrid";
import { MapToken } from "./MapToken"; 
import { TokenHUD } from "./TokenHUD"; 
import { MapContextMenu } from "./MapContextMenu";
import { FogLayer } from "./FogLayer"; 
import { PingLayer, PingData } from "./PingLayer"; 
import { useTableContext } from "@/features/table/TableContext"; 
import { supabase } from "@/integrations/supabase/client"; 
import { useQueryClient } from "@tanstack/react-query";
import { Table } from "@/types/app-types";
import { MapToken as MapTokenType } from "@/types/map-types";
import { MapControls } from "./MapControls";

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

interface MovePlan {
    token: MapTokenType;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export const MapBoard = ({ width = window.innerWidth, height = window.innerHeight, isMaster = false, tableData }: MapBoardProps) => {
  const { tableId, mapTokens, setMapTokens, fogShapes, setFogShapes, userId } = useTableContext();
  
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  const [tokenHudState, setTokenHudState] = useState<{ token: MapTokenType, x: number, y: number } | null>(null);
  const [bgMenuState, setBgMenuState] = useState<{ x: number, y: number } | null>(null); 
  
  const [activeTool, setActiveTool] = useState("select");
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [rulerStart, setRulerStart] = useState<{x: number, y: number} | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{x: number, y: number} | null>(null);

  const [movePlan, setMovePlan] = useState<MovePlan | null>(null);

  // --- ESTADOS DE PING ---
  const [pings, setPings] = useState<PingData[]>([]);

  const gridSize = tableData.map_grid_size || 50; 
  const gridOpacity = tableData.map_grid_opacity ?? 0.2;
  const backgroundUrl = tableData.map_background_url;
  const isFogEnabled = tableData.map_fog_enabled || false; 

  const queryClient = useQueryClient();
  const stageRef = useRef<any>(null);

  // --- CONFIGURAÇÃO DO REALTIME (BROADCAST) ---
  useEffect(() => {
    const channel = supabase.channel(`room:${tableId}`);

    channel
      .on('broadcast', { event: 'cursor-ping' }, (payload) => {
        addPing(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const addPing = (newPing: PingData) => {
    setPings(prev => [...prev, newPing]);
  };

  const removePing = useCallback((id: string) => {
    setPings(prev => prev.filter(p => p.id !== id));
  }, []);

  // Função para enviar o Ping
  const sendPing = async (x: number, y: number) => {
    const color = isMaster ? "#FFD700" : "#ffffff"; 
    const newPing: PingData = {
        id: crypto.randomUUID(),
        x,
        y,
        color,
        user: userId
    };

    // 1. Mostra localmente
    addPing(newPing);

    // 2. Envia para os outros
    await supabase.channel(`room:${tableId}`).send({
        type: 'broadcast',
        event: 'cursor-ping',
        payload: newPing
    });
  };

  useEffect(() => {
      if (!isFogEnabled && activeTool === "reveal") {
          setActiveTool("select");
          setIsDrawing(false); 
          setCurrentLine([]);
      }
  }, [isFogEnabled, activeTool]);

  const closeAllMenus = () => {
      setTokenHudState(null);
      setBgMenuState(null);
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(newScale, 10));

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
    
    closeAllMenus();
  };

  const executeTokenMove = async (id: string, x: number, y: number) => {
    setMapTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    
    const { error } = await supabase
      .from("map_tokens")
      .update({ x, y })
      .eq("id", id)
      .eq("table_id", tableId);
      
    if (error) {
      console.error("Erro ao mover token:", error);
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    }
  };

  const handleDragEndToken = async (id: string, x: number, y: number) => {
    closeAllMenus();
    executeTokenMove(id, x, y);
  };

  const handleTokenContextMenu = (e: KonvaEventObject<PointerEvent>, token: MapTokenType) => {
      e.evt.preventDefault();
      e.cancelBubble = true; 
      if (movePlan) {
          setMovePlan(null);
          return;
      }
      const nativeEvent = e.evt;
      setBgMenuState(null); 
      setTokenHudState({ token, x: nativeEvent.clientX, y: nativeEvent.clientY });
  };

  const handleStageContextMenu = (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (movePlan) {
          setMovePlan(null);
          return;
      }
      if (isMaster) {
          const nativeEvent = e.evt;
          setTokenHudState(null); 
          setBgMenuState({ x: nativeEvent.clientX, y: nativeEvent.clientY });
      }
  };

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
        table_id: tableId,
        character_id: characterId,
        type: type, 
        label: label,
        x: x,
        y: y,
        size: 1,
        color: "#ffffff"
    });

    if (error) console.error("Erro ao criar token:", error);
    else queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
  };

  const handleStartMove = (token: MapTokenType) => {
      const centerX = token.x + gridSize / 2;
      const centerY = token.y + gridSize / 2;

      setMovePlan({
          token: token,
          startX: centerX, 
          startY: centerY, 
          currentX: token.x, 
          currentY: token.y
      });
      closeAllMenus();
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      
      // --- LÓGICA DE PING (BOTÃO DO MEIO) ---
      // button 1 = middle mouse button (scroll wheel)
      if (e.evt.button === 1) {
          e.evt.preventDefault(); // Previne scroll automático do browser
          const pos = stage?.getRelativePointerPosition();
          if (pos) sendPing(pos.x, pos.y);
          return;
      }

      // --- LÓGICA DE PING (FERRAMENTA ATIVA) ---
      if (activeTool === "ping" && e.evt.button === 0) {
          const pos = stage?.getRelativePointerPosition();
          if (pos) {
              sendPing(pos.x, pos.y);
              // Opcional: Se quiser que volte para select após um ping, descomente abaixo
              // setActiveTool("select");
          }
          return;
      }

      // --- CONFIRMAR MOVIMENTO PLANEADO ---
      if (movePlan && e.evt.button === 0) {
          executeTokenMove(movePlan.token.id, movePlan.currentX, movePlan.currentY);
          setMovePlan(null);
          return;
      }

      // Limpar seleção ao clicar no fundo
      if (e.target === stage) {
          setSelectedTokenId(null);
          closeAllMenus();
      }

      if (activeTool === "measure" && e.evt.button === 0) {
          const pos = stage?.getRelativePointerPosition();
          if (pos) {
              setRulerStart({ x: pos.x, y: pos.y });
              setRulerEnd({ x: pos.x, y: pos.y });
          }
          return;
      }

      if (activeTool === "reveal" && isMaster && e.evt.button === 0) {
          setIsDrawing(true);
          const pos = stage?.getRelativePointerPosition();
          if (pos) setCurrentLine([pos.x, pos.y]);
      }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getRelativePointerPosition();
      
      if (!pos) return;

      if (activeTool === "measure" && rulerStart) {
          setRulerEnd({ x: pos.x, y: pos.y });
      }

      if (isDrawing && activeTool === "reveal") {
          setCurrentLine(prev => [...prev, pos.x, pos.y]);
      }

      if (movePlan) {
          const snapX = Math.round(pos.x / gridSize) * gridSize;
          const snapY = Math.round(pos.y / gridSize) * gridSize;
          
          setMovePlan(prev => prev ? ({ ...prev, currentX: snapX, currentY: snapY }) : null);
      }
  };

  const handleMouseUp = async () => {
      if (activeTool === "measure") {
          setRulerStart(null);
          setRulerEnd(null);
      }

      if (isDrawing && activeTool === "reveal") {
          setIsDrawing(false);
          if (currentLine.length < 4) return;

          const { error } = await supabase.from("map_fog").insert({
              table_id: tableId,
              points: currentLine, 
              type: "reveal"
          });

          if (error) console.error("Erro ao salvar nevoeiro:", error);
          else queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] });
          
          setCurrentLine([]);
      }
  };

  const calcDistance = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const pixels = Math.sqrt(dx * dx + dy * dy);
      const squares = pixels / gridSize;
      const meters = squares * 1.5; 
      return Math.round(meters * 10) / 10;
  };

  return (
    <div 
        className="w-full h-full bg-[#1a1a1a] overflow-hidden relative"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()} 
        onClick={closeAllMenus}
        onContextMenu={(e) => e.preventDefault()} 
    >
      <MapControls 
          tableData={tableData} 
          activeTool={activeTool} 
          onToolChange={setActiveTool} 
      />

      <Stage
        width={width}
        height={height}
        // Só arrasta o palco na ferramenta SELECT
        draggable={activeTool === "select" && !movePlan}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        ref={stageRef}
        className={
            (activeTool === "measure" || activeTool === "reveal" || activeTool === "ping" || movePlan) 
            ? "cursor-crosshair bg-black" 
            : "cursor-move bg-black"
        }
        
        onDragEnd={(e) => {
            if (e.target === e.target.getStage()) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
            }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleStageContextMenu}
      >
        <Layer>
            <BackgroundImage url={backgroundUrl} width={2000} height={2000} />
        </Layer>

        <Layer opacity={gridOpacity}> 
            <MapGrid width={4000} height={4000} gridSize={gridSize} />
        </Layer>

        <Layer>
          {mapTokens.map(token => {
            return (
                <MapToken 
                key={token.id}
                token={token}
                gridSize={gridSize}
                isDraggable={!movePlan && (isMaster || token.type === 'character') && activeTool === "select"} 
                isMaster={isMaster}
                onDragEnd={handleDragEndToken}
                onSelect={setSelectedTokenId}
                isSelected={selectedTokenId === token.id}
                onContextMenu={handleTokenContextMenu}
                />
            );
          })}
        </Layer>

        <FogLayer 
            width={4000} 
            height={4000} 
            shapes={fogShapes} 
            visible={isFogEnabled} 
            opacity={isMaster ? 0.7 : 1} 
        />

        <Layer>
            {isDrawing && (
                <Line points={currentLine} stroke="#ffcc00" strokeWidth={2} dash={[10, 5]} />
            )}
        </Layer>

        {/* CAMADA DE PINGS */}
        <PingLayer pings={pings} onComplete={removePing} />

        <Layer>
            {rulerStart && rulerEnd && activeTool === "measure" && (
                <RulerLine start={rulerStart} end={rulerEnd} distance={calcDistance(rulerStart.x, rulerStart.y, rulerEnd.x, rulerEnd.y)} />
            )}

            {movePlan && (
                <>
                    <RulerLine 
                        start={{ x: movePlan.startX, y: movePlan.startY }} 
                        end={{ x: movePlan.currentX + gridSize/2, y: movePlan.currentY + gridSize/2 }} 
                        distance={calcDistance(movePlan.startX, movePlan.startY, movePlan.currentX + gridSize/2, movePlan.currentY + gridSize/2)}
                        color="#ffffff"
                    />
                    
                    <MapToken 
                        token={{ ...movePlan.token, x: movePlan.currentX, y: movePlan.currentY }}
                        gridSize={gridSize}
                        isDraggable={false}
                        isMaster={isMaster}
                        onDragEnd={() => {}}
                        onSelect={() => {}}
                        onContextMenu={() => {}} 
                        isSelected={true} 
                    />
                </>
            )}
        </Layer>

      </Stage>

      {tokenHudState && isMaster && (
          <TokenHUD 
              token={tokenHudState.token} 
              position={{ x: tokenHudState.x, y: tokenHudState.y }} 
              onClose={() => setTokenHudState(null)}
              onStartMove={() => handleStartMove(tokenHudState.token)} 
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
        {activeTool === "ping" && <span className="text-red-400 font-bold">MODO PING</span>}
      </div>
    </div>
  );
};

const RulerLine = ({ start, end, distance, color = "#3b82f6" }: { start: {x: number, y: number}, end: {x: number, y: number}, distance: number, color?: string }) => (
    <Group>
        <Line
            points={[start.x, start.y, end.x, end.y]}
            stroke={color}
            strokeWidth={4}
            dash={[15, 10]}
            shadowColor="black"
            shadowBlur={5}
        />
        <Group x={(start.x + end.x) / 2} y={(start.y + end.y) / 2}>
            <Rect 
                width={60} height={24} 
                fill="rgba(0,0,0,0.8)" 
                cornerRadius={4}
                offsetX={30} offsetY={30}
            />
            <Text
                text={`${distance}m`} 
                fontSize={14}
                fontStyle="bold"
                fill="white"
                align="center"
                width={60}
                offsetX={30} offsetY={25}
            />
        </Group>
    </Group>
);