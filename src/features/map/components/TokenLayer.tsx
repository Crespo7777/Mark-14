// src/features/map/components/TokenLayer.tsx
import { Layer } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { MapToken } from "../MapToken";
import { MapToken as MapTokenType } from "@/types/map-types";

interface TokenLayerProps {
  tokens: MapTokenType[];
  gridSize: number;
  isMaster: boolean;
  activeTool: string;
  movingTokenId?: string; // ID do token que está a ser movido (para não duplicar ou bloquear)
  selectedTokenId: string | null;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onContextMenu: (e: KonvaEventObject<PointerEvent>, token: MapTokenType) => void;
}

export const TokenLayer = ({
  tokens,
  gridSize,
  isMaster,
  activeTool,
  movingTokenId,
  selectedTokenId,
  onDragEnd,
  onSelect,
  onContextMenu,
}: TokenLayerProps) => {
  return (
    <Layer>
      {tokens.map((token) => (
        <MapToken
          key={token.id}
          token={token}
          gridSize={gridSize}
          // Só permite arrastar se:
          // 1. Não houver um plano de movimento ativo (movingTokenId)
          // 2. For Mestre OU for personagem (e não NPC/objeto bloqueado)
          // 3. A ferramenta ativa for "select"
          isDraggable={
            !movingTokenId &&
            (isMaster || token.type === "character") &&
            activeTool === "select"
          }
          isMaster={isMaster}
          onDragEnd={onDragEnd}
          onSelect={onSelect}
          isSelected={selectedTokenId === token.id}
          onContextMenu={onContextMenu}
        />
      ))}
    </Layer>
  );
};