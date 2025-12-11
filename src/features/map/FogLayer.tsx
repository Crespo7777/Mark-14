// src/features/map/FogLayer.tsx

import React from "react";
import { Layer, Rect, Line, Group } from "react-konva";
import { FogShape } from "@/types/map-types";

interface FogLayerProps {
  width: number;
  height: number;
  shapes: FogShape[]; // Lista de áreas que o Mestre revelou
  visible: boolean;   // Se o sistema de nevoeiro está ativo globalmente
  opacity?: number;   // Opacidade da escuridão (padrão 1 = preto total)
}

// 1. React.memo: Previne re-render quando o pai muda por causa do desenho da régua/pincel
export const FogLayer = React.memo(({ width, height, shapes, visible, opacity = 1 }: FogLayerProps) => {
  // Se o nevoeiro estiver desligado, não renderiza nada
  if (!visible) return null;

  return (
    // 2. listening={false}: Remove o cálculo de eventos de rato (Hit Graph). 
    // Isto dá um boost GIGANTE de performance pois o canvas não precisa verificar colisões aqui.
    <Layer listening={false}>
      {/* 1. A Escuridão Total (Fundo Preto) */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="black"
        opacity={opacity}
        // 3. perfectDrawEnabled={false}: Desliga cálculos de pixel-perfect (desnecessário para nevoeiro)
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      />

      {/* 2. Os "Buracos" (Áreas Reveladas) */}
      {/* Usamos 'destination-out' para que estas formas APAGUEM o preto de cima */}
      <Group globalCompositeOperation="destination-out">
        {shapes.map((shape) => (
          <Line
            key={shape.id}
            points={shape.points}
            fill="black"
            stroke="black"
            strokeWidth={40} // Borda suave/grossa para facilitar revelação manual
            tension={0.2}    // Suaviza ligeiramente as linhas desenhadas à mão
            closed={true}    // Garante que a forma é um polígono fechado
            listening={false}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        ))}
      </Group>
    </Layer>
  );
});

FogLayer.displayName = "FogLayer";