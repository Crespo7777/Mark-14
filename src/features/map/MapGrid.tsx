import { Group, Line } from "react-konva"; // <--- Mudamos de Layer para Group
import { useMemo } from "react";

interface MapGridProps {
  width: number;
  height: number;
  gridSize: number;
  strokeColor?: string;
}

export const MapGrid = ({ width, height, gridSize, strokeColor = "#ffffff" }: MapGridProps) => {
  const lines = useMemo(() => {
    const lineComponents = [];
    
    // Linhas Verticais
    for (let x = 0; x <= width; x += gridSize) {
      lineComponents.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={strokeColor}
          strokeWidth={1}
          opacity={0.3} // Aumentei ligeiramente para visibilidade padrão
        />
      );
    }

    // Linhas Horizontais
    for (let y = 0; y <= height; y += gridSize) {
      lineComponents.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={strokeColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    return lineComponents;
  }, [width, height, gridSize, strokeColor]);

  // CORREÇÃO CRÍTICA: Retornar Group, não Layer.
  // Uma Layer não pode estar dentro de outra Layer.
  return <Group>{lines}</Group>;
};