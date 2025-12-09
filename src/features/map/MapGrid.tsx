import { Layer, Line } from "react-konva";
import { useMemo } from "react";

interface MapGridProps {
  width: number;
  height: number;
  gridSize: number;
  strokeColor?: string;
}

export const MapGrid = ({ width, height, gridSize, strokeColor = "#ffffff" }: MapGridProps) => {
  // Otimização: Calcular as linhas apenas quando as dimensões mudam
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
          opacity={0.1} // Bem subtil
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
          opacity={0.1}
        />
      );
    }

    return lineComponents;
  }, [width, height, gridSize, strokeColor]);

  return <Layer>{lines}</Layer>;
};