// src/features/map/components/InteractionLayer.tsx
import { Layer, Line } from "react-konva";
import { RulerLine } from "./RulerLine"; // O componente que criámos antes
import { MapToken } from "../MapToken";
import { MapToken as MapTokenType } from "@/types/map-types";

interface InteractionState {
  isDrawing: boolean;
  currentLine: number[];
  rulerStart: { x: number; y: number } | null;
  rulerEnd: { x: number; y: number } | null;
  movePlan: {
    token: MapTokenType;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
}

interface InteractionLayerProps {
  state: InteractionState;
  gridSize: number;
  isMaster: boolean;
}

export const InteractionLayer = ({ state, gridSize, isMaster }: InteractionLayerProps) => {
  const { isDrawing, currentLine, rulerStart, rulerEnd, movePlan } = state;

  // Se não houver nada a acontecer, nem renderiza a layer (Performance)
  if (!isDrawing && !rulerStart && !movePlan) return null;

  return (
    <Layer>
      {/* 1. Linha de Desenho (Nevoeiro) */}
      {isDrawing && (
        <Line
          points={currentLine}
          stroke="#ffcc00"
          strokeWidth={2}
          dash={[10, 5]}
        />
      )}

      {/* 2. Régua de Medição */}
      {rulerStart && rulerEnd && (
        <RulerLine
          start={rulerStart}
          end={rulerEnd}
          gridSize={gridSize}
        />
      )}

      {/* 3. Planeamento de Movimento (Ghost Token + Régua Branca) */}
      {movePlan && (
        <>
          <RulerLine
            start={{ x: movePlan.startX, y: movePlan.startY }}
            end={{
              x: movePlan.currentX + gridSize / 2,
              y: movePlan.currentY + gridSize / 2,
            }}
            gridSize={gridSize}
            color="#ffffff"
          />
          <MapToken
            token={{
              ...movePlan.token,
              x: movePlan.currentX,
              y: movePlan.currentY,
            }}
            gridSize={gridSize}
            isDraggable={false}
            isMaster={isMaster}
            // Callbacks vazios pois é apenas visual
            onDragEnd={() => {}}
            onSelect={() => {}}
            onContextMenu={() => {}}
            isSelected={true}
            opacity={0.6} // Ligeiramente transparente
          />
        </>
      )}
    </Layer>
  );
};