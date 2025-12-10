import { Group, Circle, Text, Rect } from "react-konva"; 
import useImage from "use-image";
import { MapToken as MapTokenType } from "@/types/map-types";
import { useTableContext } from "@/features/table/TableContext";
import { useMemo } from "react";

interface MapTokenProps {
  token: MapTokenType;
  gridSize: number;
  isDraggable: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void; 
  onContextMenu: (e: any, token: MapTokenType) => void;
  isSelected: boolean;
  isMaster: boolean;
}

export const MapToken = ({ token, gridSize, isDraggable, onDragEnd, onSelect, onContextMenu, isSelected, isMaster }: MapTokenProps) => {
  const { characters } = useTableContext();
  
  // CORREÇÃO: image_url (snake_case)
  const [image] = useImage(token.image_url || "", "anonymous");
  
  // CORREÇÃO: is_hidden (snake_case)
  if (token.is_hidden && !isMaster) {
      return null;
  }

  // CORREÇÃO: character_id (snake_case)
  const linkedCharacter = useMemo(() => 
    characters.find(c => c.id === token.character_id), 
  [characters, token.character_id]);

  const hpCurrent = Number(linkedCharacter?.data?.toughness?.current) || 0;
  const hpMax = Number(linkedCharacter?.data?.toughness?.max) || 10; 
  const hpPercentage = Math.max(0, Math.min(1, hpCurrent / hpMax));
  
  const barColor = hpPercentage > 0.5 ? "#22c55e" : hpPercentage > 0.2 ? "#eab308" : "#ef4444";
  const radius = (gridSize * token.size) / 2;

  // CORREÇÃO: status_effects (snake_case)
  const isDead = (token.status_effects || []).includes("dead");
  const isBloodied = (token.status_effects || []).includes("bloodied");

  const handleDragEnd = (e: any) => {
    const x = e.target.x();
    const y = e.target.y();
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;
    
    e.target.x(snapX);
    e.target.y(snapY);
    
    onDragEnd(token.id, snapX, snapY);
  };

  return (
    <Group
      x={token.x}
      y={token.y}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(token.id);
      }}
      onContextMenu={(e) => {
          e.evt.preventDefault(); 
          if (isMaster) { 
             onContextMenu(e, token);
          }
      }}
      opacity={token.is_hidden ? 0.5 : 1}
    >
      {isSelected && (
        <Circle
          radius={radius + 4}
          stroke="#ff9900"
          strokeWidth={3}
          offsetX={-gridSize / 2} 
          offsetY={-gridSize / 2}
          opacity={0.8}
          shadowColor="#ff9900"
          shadowBlur={10}
        />
      )}

      <Circle
        radius={radius - 2}
        fill={image ? "white" : token.color}
        stroke={token.color || "#000"}
        strokeWidth={2}
        offsetX={-gridSize / 2}
        offsetY={-gridSize / 2}
        shadowColor="black"
        shadowBlur={isBloodied ? 15 : 8} 
        shadowColor={isBloodied ? "red" : "black"}
        shadowOpacity={0.6}
      />

      {image && (
        <Circle
          radius={radius - 2}
          fillPatternImage={image}
          fillPatternScale={{
            x: (radius * 2) / image.width,
            y: (radius * 2) / image.height
          }}
          fillPatternOffset={{ x: image.width / 2, y: image.height / 2 }} 
          offsetX={-gridSize / 2}
          offsetY={-gridSize / 2}
          opacity={isDead ? 0.5 : 1} 
        />
      )}

      {isDead && (
         <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
            <Text 
                text="💀" 
                fontSize={gridSize * 0.8} 
                x={-gridSize/2 + 5} 
                y={-gridSize/2 + 5} 
            />
         </Group>
      )}

      {linkedCharacter && !isDead && (
        <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
            <Rect 
                x={-radius} 
                y={-radius - 10} 
                width={radius * 2} 
                height={6} 
                fill="#1f2937" 
                cornerRadius={2}
                stroke="black"
                strokeWidth={0.5}
            />
            <Rect 
                x={-radius} 
                y={-radius - 10} 
                width={(radius * 2) * hpPercentage} 
                height={6} 
                fill={barColor} 
                cornerRadius={2}
            />
        </Group>
      )}

      <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
         <Text
            text={token.label}
            y={radius + 8}
            align="center"
            width={gridSize * 3} 
            offsetX={gridSize} 
            fontSize={12}
            fill="white"
            stroke="black"
            strokeWidth={0.5}
            fontStyle="bold"
            listening={false}
         />
      </Group>
    </Group>
  );
};