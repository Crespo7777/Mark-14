// src/features/map/components/InteractionLayer.tsx

import React from "react";
import { Layer, Line } from "react-konva";
import { RulerLine } from "./RulerLine"; 
import { MapToken } from "../MapToken";
import { MapToken as MapTokenType } from "@/types/map-types";

interface InteractionState {
  isDrawing: boolean;
  currentPoints: number[];
  measurePath?: { x: number; y: number }[];
  rulerStart: { x: number; y: number } | null;
  rulerEnd: { x: number; y: number } | null;
  movePlan: any;
}

interface InteractionLayerProps {
  state: InteractionState;
  gridSize: number;
  isMaster: boolean;
  activeTool: string; // <--- NOVO PROP
}

// Helper para distância
const getDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}, gridSize: number) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixels = Math.sqrt(dx*dx + dy*dy);
    return Math.round((pixels / gridSize) * 1.5 * 10) / 10;
};

export const InteractionLayer = React.memo(({ state, gridSize, isMaster, activeTool }: InteractionLayerProps) => {
  const { isDrawing, currentPoints, measurePath, movePlan } = state;

  if (!isDrawing && (!measurePath || measurePath.length === 0) && !movePlan) return null;

  // Só fecha a forma se for Retângulo ou Círculo
  const shouldCloseShape = activeTool === "reveal-rect" || activeTool === "reveal-circle";

  return (
    <Layer>
      {/* 1. Desenho Temporário (Amarelo) */}
      {isDrawing && (
        <Line
          points={currentPoints}
          stroke="#ffcc00"
          strokeWidth={2}
          dash={[10, 5]}
          closed={shouldCloseShape} 
          fill={shouldCloseShape ? "rgba(255, 204, 0, 0.1)" : undefined} // Só preenche se fechado
          listening={false}
        />
      )}

      {/* 2. Régua (Path) */}
      {measurePath && measurePath.length > 1 && (
         <>
            {measurePath.slice(0, -1).map((p, i) => {
                const pNext = measurePath[i + 1];
                const segmentDist = getDistance(p, pNext, gridSize);
                let totalDist = 0;
                for(let j = 0; j <= i; j++) {
                    totalDist += getDistance(measurePath[j], measurePath[j+1], gridSize);
                }
                const label = measurePath.length > 2 ? `${segmentDist}m [${Math.round(totalDist*10)/10}]` : `${segmentDist}m`;

                return (
                    <RulerLine 
                        key={i}
                        start={p}
                        end={pNext}
                        gridSize={gridSize}
                        text={label}
                    />
                );
            })}
             {measurePath.map((p, i) => (
                <Line key={`dot-${i}`} points={[p.x, p.y]} stroke="white" strokeWidth={4} lineCap="round" shadowColor="black" shadowBlur={2} />
            ))}
         </>
      )}

      {/* 3. Ghost Token */}
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
            onDragEnd={() => {}}
            onSelect={() => {}}
            onContextMenu={() => {}}
            isSelected={true}
          />
        </>
      )}
    </Layer>
  );
});

InteractionLayer.displayName = "InteractionLayer";