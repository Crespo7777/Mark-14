// src/features/map/components/RulerLine.tsx
import React from "react";
import { Group, Line, Rect, Text } from "react-konva";

interface RulerLineProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  gridSize: number;
  color?: string;
}

export const RulerLine = React.memo(({ start, end, gridSize, color = "#3b82f6" }: RulerLineProps) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const pixels = Math.sqrt(dx * dx + dy * dy);
  const squares = pixels / gridSize;
  const distance = Math.round(squares * 1.5 * 10) / 10;

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    // listening={false} é CRÍTICO para performance. O rato "atravessa" a régua.
    <Group listening={false}>
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
          offsetY={12}
        />
        <Text
          text={`${distance}m`}
          fontSize={14}
          fontStyle="bold"
          fill="white"
          align="center"
          width={60}
          offsetX={30}
          offsetY={7}
        />
      </Group>
    </Group>
  );
});

RulerLine.displayName = "RulerLine";