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

// Usamos React.memo para evitar re-renders desnecessários quando outros tokens se movem
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
  
  // Ref para o círculo de animação (evita re-renders de estado para animação)
  const turnRingRef = useRef<Konva.Circle>(null);

  // 1. DADOS DERIVADOS (Memoizados para performance)
  const linkedCharacter = useMemo(() => 
    characters.find(c => c.id === token.character_id), 
  [characters, token.character_id]);

  const combatantEntry = useMemo(() => 
    combatants.find(c => c.token_id === token.id),
  [combatants, token.id]);

  const isActiveTurn = combatantEntry?.is_turn || false;
  const isInCombat = !!combatantEntry;

  // Se estiver oculto e não for mestre, nem renderiza (poupa GPU)
  if (token.is_hidden && !isMaster) {
      return null;
  }

  // 2. ANIMAÇÃO DE TURNO (Direta no Canvas Node)
  useEffect(() => {
    let anim: Konva.Animation | null = null;

    if (isActiveTurn && turnRingRef.current) {
        const node = turnRingRef.current;
        anim = new Konva.Animation((frame) => {
            if (!frame) return;
            // Pulsação suave usando seno
            const scale = 1 + Math.sin(frame.time / 300) * 0.08;
            const opacity = 0.6 + Math.sin(frame.time / 300) * 0.4;
            
            node.scale({ x: scale, y: scale });
            node.opacity(opacity);
        }, node.getLayer());
        
        anim.start();
    }

    return () => {
        if (anim) anim.stop();
    };
  }, [isActiveTurn]);

  // 3. CÁLCULOS VISUAIS
  const hpCurrent = Number(linkedCharacter?.data?.toughness?.current) || 0;
  const hpMax = Number(linkedCharacter?.data?.toughness?.max) || 10; 
  const hpPercentage = Math.max(0, Math.min(1, hpCurrent / hpMax));
  
  // Cores dinâmicas para a barra de vida (Verde -> Amarelo -> Vermelho)
  const barColor = hpPercentage > 0.5 ? "#22c55e" : hpPercentage > 0.2 ? "#eab308" : "#ef4444";
  const radius = (gridSize * (token.size || 1)) / 2;

  const isDead = (token.status_effects || []).includes("dead");
  const isBloodied = (token.status_effects || []).includes("bloodied");

  // Handler de arrasto otimizado (Snap to Grid)
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x();
    const y = e.target.y();
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;
    
    // Atualiza visualmente imediatamente (sem esperar o servidor)
    e.target.to({
        x: snapX,
        y: snapY,
        duration: 0.1,
        easing: Konva.Easings.EaseOut
    });
    
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
      {/* IMPORTANTE: `listening={false}` é a chave da performance.
         Elementos visuais não devem capturar eventos do mouse, apenas o círculo base.
      */}

      {/* 1. Anel de Turno (Pulsante) */}
      {isActiveTurn && (
        <Circle
            ref={turnRingRef}
            radius={radius + 6}
            stroke="#fbbf24" // Dourado
            strokeWidth={4}
            offsetX={-gridSize / 2} 
            offsetY={-gridSize / 2}
            shadowColor="#fbbf24"
            shadowBlur={15}
            listening={false} // Performance: Não detecta cliques
        />
      )}

      {/* 2. Anel de Seleção (Estático) */}
      {isSelected && (
        <Circle
          radius={radius + 2}
          stroke="#f97316" // Laranja
          strokeWidth={3}
          offsetX={-gridSize / 2} 
          offsetY={-gridSize / 2}
          shadowColor="#f97316"
          shadowBlur={5}
          listening={false}
        />
      )}

      {/* 3. Indicador de Combate (Tracejado) */}
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

      {/* 4. BASE DO TOKEN (Hit Area) - Único que ouve cliques */}
      <Circle
        radius={radius - 2}
        fill={image ? "white" : (token.color || "#444")}
        stroke={isBloodied ? "#ef4444" : (token.color || "#000")}
        strokeWidth={isBloodied ? 3 : 1}
        offsetX={-gridSize / 2}
        offsetY={-gridSize / 2}
        // Sombras são caras, usamos apenas se necessário
        shadowColor={isBloodied ? "red" : "black"}
        shadowBlur={isBloodied ? 10 : 0} 
        shadowOpacity={0.5}
      />

      {/* 5. Imagem do Personagem */}
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
          listening={false} // O clique passa para o círculo base
        />
      )}

      {/* 6. Ícone de Morte (Caveira) */}
      {isDead && (
         <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2} listening={false}>
            <Text 
                text="💀" 
                fontSize={gridSize * 0.8} 
                x={-gridSize/2 + (gridSize * 0.1)} 
                y={-gridSize/2 + (gridSize * 0.1)} 
                opacity={0.8}
            />
         </Group>
      )}

      {/* 7. Barra de Vida (Estilo Foundry: Pequena e no topo) */}
      {linkedCharacter && !isDead && (
        <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2} listening={false}>
            {/* Fundo da barra (Preto) */}
            <Rect 
                x={-radius} 
                y={-radius - 8} 
                width={radius * 2} 
                height={5} 
                fill="#000000" 
                cornerRadius={2} 
                opacity={0.7}
            />
            {/* Barra colorida */}
            <Rect 
                x={-radius} 
                y={-radius - 8} 
                width={(radius * 2) * hpPercentage} 
                height={5} 
                fill={barColor} 
                cornerRadius={2}
            />
        </Group>
      )}

      {/* 8. Nome do Token */}
      {/* Só mostra se selecionado ou hover (para limpar o mapa) ou se for Mestre */}
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

// displayName é útil para debugging no React DevTools
MapToken.displayName = "MapToken";