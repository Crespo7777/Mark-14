// src/features/map/components/RulerLine.tsx
import { Group, Line, Rect, Text } from "react-konva";

interface RulerLineProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  gridSize: number; // Precisamos disto para calcular a distância
  color?: string;
}

export const RulerLine = ({ start, end, gridSize, color = "#3b82f6" }: RulerLineProps) => {
  // Cálculo de distância isolado aqui
  const calcDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    const squares = pixels / gridSize;
    const meters = squares * 1.5; // Regra D&D 5e: 1 quadrado = 1.5m (5ft)
    return Math.round(meters * 10) / 10;
  };

  const distance = calcDistance(start.x, start.y, end.x, end.y);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <Group>
      <Line
        points={[start.x, start.y, end.x, end.y]}
        stroke={color}
        strokeWidth={4}
        dash={[15, 10]}
        shadowColor="black"
        shadowBlur={5}
      />
      <Group x={midX} y={midY}>
        <Rect
          width={60}
          height={24}
          fill="rgba(0,0,0,0.8)"
          cornerRadius={4}
          offsetX={30}
          offsetY={30}
        />
        <Text
          text={`${distance}m`}
          fontSize={14}
          fontStyle="bold"
          fill="white"
          align="center"
          width={60}
          offsetX={30}
          offsetY={25}
        />
      </Group>
    </Group>
  );
};