import { Layer, Rect, Line, Group } from "react-konva";
import { FogShape } from "@/types/map-types";

interface FogLayerProps {
  width: number;
  height: number;
  shapes: FogShape[]; // Lista de áreas que o Mestre revelou
  visible: boolean;   // Se o sistema de nevoeiro está ativo globalmente
  opacity?: number;   // Opacidade da escuridão (padrão 1 = preto total)
}

export const FogLayer = ({ width, height, shapes, visible, opacity = 1 }: FogLayerProps) => {
  // Se o nevoeiro estiver desligado, não renderiza nada (mapa totalmente visível)
  if (!visible) return null;

  return (
    <Layer>
      {/* 1. A Escuridão Total (Fundo Preto) */}
      {/* Esta camada cobre todo o mapa com preto */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="black"
        opacity={opacity}
        listening={false} // Permite clicar através do nevoeiro (para mover tokens)
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
          />
        ))}
      </Group>
    </Layer>
  );
};