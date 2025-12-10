import { Group, Circle, Text, Rect } from "react-konva"; 
import useImage from "use-image";
import { MapToken as MapTokenType } from "@/types/map-types";
import { useTableContext } from "@/features/table/TableContext";
import { useMemo, useEffect, useRef } from "react";
import Konva from "konva";

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
  const { characters, combatants } = useTableContext(); // Ler combatentes do contexto
  const [image] = useImage(token.image_url || "", "anonymous");
  
  // Referência para animação do turno
  const turnRingRef = useRef<Konva.Circle>(null);

  if (token.is_hidden && !isMaster) {
      return null;
  }

  const linkedCharacter = useMemo(() => 
    characters.find(c => c.id === token.character_id), 
  [characters, token.character_id]);

  // --- VERIFICAR COMBATE ---
  const combatantEntry = useMemo(() => 
    combatants.find(c => c.token_id === token.id),
  [combatants, token.id]);

  const isActiveTurn = combatantEntry?.is_turn || false;
  const isInCombat = !!combatantEntry;

  // Animação de Pulso para o Turno Ativo
  useEffect(() => {
    if (isActiveTurn && turnRingRef.current) {
        const anim = new Konva.Animation((frame) => {
            if (!frame) return;
            // Oscila a opacidade e o strokeWidth
            const scale = 1 + Math.sin(frame.time / 200) * 0.1;
            turnRingRef.current?.scale({ x: scale, y: scale });
            turnRingRef.current?.opacity(0.8 + Math.sin(frame.time / 200) * 0.2);
        }, turnRingRef.current.getLayer());
        anim.start();
        return () => anim.stop();
    }
  }, [isActiveTurn]);

  const hpCurrent = Number(linkedCharacter?.data?.toughness?.current) || 0;
  const hpMax = Number(linkedCharacter?.data?.toughness?.max) || 10; 
  const hpPercentage = Math.max(0, Math.min(1, hpCurrent / hpMax));
  
  const barColor = hpPercentage > 0.5 ? "#22c55e" : hpPercentage > 0.2 ? "#eab308" : "#ef4444";
  const radius = (gridSize * token.size) / 2;

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
      {/* 1. Anel de Turno Ativo (Aura Dourada Pulsante) */}
      {isActiveTurn && (
        <Circle
            ref={turnRingRef}
            radius={radius + 8}
            stroke="#fbbf24" // Amber/Gold
            strokeWidth={4}
            offsetX={-gridSize / 2} 
            offsetY={-gridSize / 2}
            shadowColor="#fbbf24"
            shadowBlur={20}
            listening={false}
        />
      )}

      {/* 2. Anel de Seleção (Laranja - Por cima do turno) */}
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

      {/* 3. Marcador "Em Combate" (Borda Sutil se não for o turno) */}
      {isInCombat && !isActiveTurn && !isSelected && (
         <Circle
            radius={radius + 2}
            stroke="#ffffff"
            strokeWidth={1}
            dash={[4, 4]} // Tracejado
            opacity={0.5}
            offsetX={-gridSize / 2} 
            offsetY={-gridSize / 2}
         />
      )}

      {/* 4. Base do Token */}
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

      {/* 5. Imagem */}
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

      {/* 6. Ícones de Estado */}
      {isDead && (
         <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
            <Text text="💀" fontSize={gridSize * 0.8} x={-gridSize/2 + 5} y={-gridSize/2 + 5} />
         </Group>
      )}

      {/* 7. Barra de Vida */}
      {linkedCharacter && !isDead && (
        <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
            <Rect 
                x={-radius} y={-radius - 10} 
                width={radius * 2} height={6} 
                fill="#1f2937" cornerRadius={2} stroke="black" strokeWidth={0.5}
            />
            <Rect 
                x={-radius} y={-radius - 10} 
                width={(radius * 2) * hpPercentage} height={6} 
                fill={barColor} cornerRadius={2}
            />
        </Group>
      )}

      {/* 8. Nome */}
      <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
         <Text
            text={token.label}
            y={radius + 8}
            align="center"
            width={gridSize * 3} 
            offsetX={gridSize} 
            fontSize={12}
            fill="white" stroke="black" strokeWidth={0.5}
            fontStyle="bold" listening={false}
         />
      </Group>
    </Group>
  );
};