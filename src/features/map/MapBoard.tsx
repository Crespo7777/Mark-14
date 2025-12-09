import { useState, useRef } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { MapGrid } from "./MapGrid";
import { MapToken } from "./MapToken"; // <--- Importar o novo componente
import { MapToken as MapTokenType } from "@/types/map-types";

interface MapBoardProps {
  width?: number;
  height?: number;
  isMaster?: boolean;
}

export const MapBoard = ({ width = window.innerWidth, height = window.innerHeight, isMaster = false }: MapBoardProps) => {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const gridSize = 50; // Tamanho padrão da célula

  // --- DADOS TEMPORÁRIOS (Mock) ---
  // No futuro, isto virá do useTableRealtime / Supabase
  const [tokens, setTokens] = useState<MapTokenType[]>([
    {
      id: "t1",
      label: "Guerreiro",
      type: "character",
      x: 100, // Coluna 2 (50 * 2)
      y: 100, // Linha 2
      size: 1,
      color: "#3b82f6", // Blue
      rotation: 0
    },
    {
      id: "t2",
      label: "Goblin",
      type: "monster",
      x: 250, // Coluna 5
      y: 200, // Linha 4
      size: 1,
      color: "#ef4444", // Red
      rotation: 0
    }
  ]);
  
  const stageRef = useRef<any>(null);

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
    const clampedScale = Math.max(0.2, Math.min(newScale, 5));

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Função para atualizar posição do token (Localmente por enquanto)
  const handleTokenMove = (id: string, x: number, y: number) => {
    console.log(`Token ${id} moved to ${x}, ${y}`);
    setTokens(prev => prev.map(t => 
        t.id === id ? { ...t, x, y } : t
    ));
    // AQUI: No futuro, chamaremos supabase.from('map_tokens').update(...)
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] overflow-hidden relative">
      <Stage
        width={width}
        height={height}
        draggable
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        ref={stageRef}
        className="cursor-move bg-zinc-900"
        // Impedir que arrastar um token arraste o mapa todo
        onDragStart={(e) => {
             if (e.target.nodeType === 'Group') { // Se for token
                 e.target.stopDrag(); // O Konva gere o drag do token separadamente se configurado
             }
        }}
      >
        <Layer>
            <Rect width={2000} height={2000} fill="#18181b" />
        </Layer>

        <MapGrid width={2000} height={2000} gridSize={gridSize} />

        {/* Camada de Tokens */}
        <Layer>
             {tokens.map(token => (
                 <MapToken 
                    key={token.id}
                    token={token}
                    gridSize={gridSize}
                    isDraggable={isMaster || token.type === 'character'} // Mestre move tudo, jogadores só os seus
                    onDragEnd={handleTokenMove}
                 />
             ))}
        </Layer>

      </Stage>

      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs pointer-events-none select-none border border-white/10">
        Zoom: {Math.round(stageScale * 100)}% | Tokens: {tokens.length}
      </div>
    </div>
  );
};