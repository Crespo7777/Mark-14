// src/features/map/MapToken.tsx

import React, { useMemo, useEffect, useRef } from "react";
import { Group, Circle, Text, Rect } from "react-konva"; 
import useImage from "use-image";
import Konva from "konva";
import { MapToken as MapTokenType } from "@/types/map-types";
import { useTableContext } from "@/features/table/TableContext";

interface MapTokenProps {
  token: MapTokenType;
  gridSize: number;
  isDraggable: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void; 
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>, token: MapTokenType) => void;
  isSelected: boolean;
  isMaster: boolean;
}

export const MapToken = React.memo(({ 
  token, 
  gridSize, 
  isDraggable, 
  onDragEnd, 
  onSelect, 
  onContextMenu, 
  isSelected, 
  isMaster 
}: MapTokenProps) => {
  const { characters, combatants } = useTableContext();
  const [image] = useImage(token.image_url || "", "anonymous");
  const turnRingRef = useRef<Konva.Circle>(null);

  // 1. DADOS DE PERSONAGEM (Apenas se for Character)
  const linkedCharacter = useMemo(() => 
    token.type === 'character' ? characters.find(c => c.id === token.character_id) : null, 
  [characters, token.character_id, token.type]);

  const combatantEntry = useMemo(() => 
    combatants.find(c => c.token_id === token.id),
  [combatants, token.id]);

  const isActiveTurn = combatantEntry?.is_turn || false;
  const isInCombat = !!combatantEntry;

  if (token.is_hidden && !isMaster) {
      return null;
  }

  // 2. ANIMAÇÃO DE TURNO
  useEffect(() => {
    let anim: Konva.Animation | null = null;
    if (isActiveTurn && turnRingRef.current) {
        const node = turnRingRef.current;
        anim = new Konva.Animation((frame) => {
            if (!frame) return;
            const scale = 1 + Math.sin(frame.time / 300) * 0.08;
            const opacity = 0.6 + Math.sin(frame.time / 300) * 0.4;
            node.scale({ x: scale, y: scale });
            node.opacity(opacity);
        }, node.getLayer());
        anim.start();
    }
    return () => { if (anim) anim.stop(); };
  }, [isActiveTurn]);

  // 3. LÓGICA DE VIDA (HÍBRIDA E INDEPENDENTE)
  let hpCurrent = 0;
  let hpMax = 10;
  let showBar = false;

  // Prioridade 1: Vida Própria do Token (NPCs Independentes ou Monstros)
  if (token.stats?.hp) {
      hpCurrent = token.stats.hp.current;
      hpMax = token.stats.hp.max;
      showBar = true;
  } 
  // Prioridade 2: Ficha Vinculada (Personagens Jogadores)
  else if (linkedCharacter?.data?.toughness) {
      hpCurrent = Number(linkedCharacter.data.toughness.current) || 0;
      hpMax = Number(linkedCharacter.data.toughness.max) || 10;
      showBar = true;
  }

  const hpPercentage = Math.max(0, Math.min(1, hpCurrent / hpMax));
  const barColor = hpPercentage > 0.5 ? "#22c55e" : hpPercentage > 0.2 ? "#eab308" : "#ef4444";
  const radius = (gridSize * (token.size || 1)) / 2;

  const isDead = (token.status_effects || []).includes("dead");
  const isBloodied = (token.status_effects || []).includes("bloodied");

  // 4. HANDLER DE ARRASTO CORRIGIDO (Evita o "Pulo")
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x();
    const y = e.target.y();
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;
    
    // Atualiza a posição visualmente AGORA
    e.target.x(snapX);
    e.target.y(snapY);
    
    // Notifica o pai para salvar, mas o visual já está no sítio certo
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
      {/* 1. Anel de Turno */}
      {isActiveTurn && (
        <Circle
            ref={turnRingRef}
            radius={radius + 6}
            stroke="#fbbf24"
            strokeWidth={4}
            offsetX={-gridSize / 2} 
            offsetY={-gridSize / 2}
            shadowColor="#fbbf24"
            shadowBlur={15}
            listening={false}
        />
      )}

      {/* 2. Seleção */}
      {isSelected && (
        <Circle
          radius={radius + 2}
          stroke="#f97316"
          strokeWidth={3}
          offsetX={-gridSize / 2} 
          offsetY={-gridSize / 2}
          shadowColor="#f97316"
          shadowBlur={5}
          listening={false}
        />
      )}

      {/* 3. Indicador de Combate */}
      {isInCombat && !isActiveTurn && !isSelected && (
         <Circle
            radius={radius + 2}
            stroke="white"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.4}
            offsetX={-gridSize / 2} 
            offsetY={-gridSize / 2}
            listening={false}
         />
      )}

      {/* 4. BASE DO TOKEN */}
      <Circle
        radius={radius - 2}
        fill={image ? "white" : (token.color || "#444")}
        stroke={isBloodied ? "#ef4444" : (token.color || "#000")}
        strokeWidth={isBloodied ? 3 : 1}
        offsetX={-gridSize / 2}
        offsetY={-gridSize / 2}
        shadowColor={isBloodied ? "red" : "black"}
        shadowBlur={isBloodied ? 10 : 0} 
        shadowOpacity={0.5}
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
          listening={false}
        />
      )}

      {/* 6. Ícone de Morte */}
      {isDead && (
         <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2} listening={false}>
            <Text text="💀" fontSize={gridSize * 0.8} x={-gridSize/2 + 5} y={-gridSize/2 + 5} opacity={0.8} />
         </Group>
      )}

      {/* 7. Barra de Vida (Agora funciona para NPCs Independentes) */}
      {showBar && !isDead && (
        <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2} listening={false}>
            <Rect x={-radius} y={-radius - 8} width={radius * 2} height={5} fill="#000000" cornerRadius={2} opacity={0.7} />
            <Rect x={-radius} y={-radius - 8} width={(radius * 2) * hpPercentage} height={5} fill={barColor} cornerRadius={2} />
        </Group>
      )}

      {/* 8. Nome */}
      {(isSelected || isMaster) && (
          <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2} listening={false}>
             <Text
                text={token.label}
                y={radius + 5}
                width={gridSize * 3} 
                offsetX={gridSize} 
                align="center"
                fontSize={11}
                fontFamily="Arial"
                fill="white"
                stroke="black"
                strokeWidth={0.5}
                fontStyle="bold"
                shadowColor="black"
                shadowBlur={2}
                shadowOpacity={0.8}
             />
          </Group>
      )}
    </Group>
  );
});

MapToken.displayName = "MapToken";