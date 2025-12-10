// src/features/map/hooks/useMapInteractions.ts
import { useState } from "react";
import { KonvaEventObject } from "konva/lib/Node";
import { MapToken } from "@/types/map-types";

// Interface para o plano de movimento (Ghost Token)
export interface MovePlan {
  token: MapToken;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseMapInteractionsProps {
  stageRef: React.RefObject<any>;
  activeTool: string;
  gridSize: number;
  isMaster: boolean;
  // Callbacks para ações que alteram dados reais
  callbacks: {
    onPing: (x: number, y: number) => void;
    onFogCreate: (points: number[]) => void;
    onMoveConfirm: (token: MapToken, x: number, y: number) => void;
    onSelectToken: (id: string | null) => void;
    onCloseMenus: () => void;
  };
}

export const useMapInteractions = ({
  stageRef,
  activeTool,
  gridSize,
  isMaster,
  callbacks,
}: UseMapInteractionsProps) => {
  // --- ESTADOS INTERNOS DE INTERAÇÃO ---
  const [isDrawing, setIsDrawing] = useState(false); // Nevoeiro
  const [currentLine, setCurrentLine] = useState<number[]>([]); // Linha de nevoeiro atual
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ x: number; y: number } | null>(null);
  const [movePlan, setMovePlan] = useState<MovePlan | null>(null);

  // --- HANDLERS ---

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();
    if (!pos) return;

    // 1. Botão do Meio (Scroll) ou Ferramenta Ping -> PING
    if (e.evt.button === 1 || (activeTool === "ping" && e.evt.button === 0)) {
      e.evt.preventDefault();
      callbacks.onPing(pos.x, pos.y);
      return;
    }

    // 2. Confirmar Movimento (Move Plan)
    if (movePlan && e.evt.button === 0) {
      callbacks.onMoveConfirm(movePlan.token, movePlan.currentX, movePlan.currentY);
      setMovePlan(null);
      return;
    }

    // 3. Limpar Seleção (Clique no vazio)
    if (e.target === stage) {
      callbacks.onSelectToken(null);
      callbacks.onCloseMenus();
    }

    // 4. Iniciar Régua
    if (activeTool === "measure" && e.evt.button === 0) {
      setRulerStart({ x: pos.x, y: pos.y });
      setRulerEnd({ x: pos.x, y: pos.y });
      return;
    }

    // 5. Iniciar Desenho de Nevoeiro
    if (activeTool === "reveal" && isMaster && e.evt.button === 0) {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getRelativePointerPosition();
    if (!pos) return;

    // Atualizar Régua
    if (activeTool === "measure" && rulerStart) {
      setRulerEnd({ x: pos.x, y: pos.y });
    }

    // Atualizar Linha de Nevoeiro
    if (isDrawing && activeTool === "reveal") {
      setCurrentLine((prev) => [...prev, pos.x, pos.y]);
    }

    // Atualizar Ghost Token (Movimento)
    if (movePlan) {
      const snapX = Math.round(pos.x / gridSize) * gridSize;
      const snapY = Math.round(pos.y / gridSize) * gridSize;
      setMovePlan((prev) =>
        prev ? { ...prev, currentX: snapX, currentY: snapY } : null
      );
    }
  };

  const handleMouseUp = () => {
    // Finalizar Régua
    if (activeTool === "measure") {
      setRulerStart(null);
      setRulerEnd(null);
    }

    // Finalizar Nevoeiro
    if (isDrawing && activeTool === "reveal") {
      setIsDrawing(false);
      if (currentLine.length >= 4) {
        callbacks.onFogCreate(currentLine);
      }
      setCurrentLine([]);
    }
  };

  // Função helper para iniciar movimento (chamada pelo TokenHUD externo)
  const startMove = (token: MapToken) => {
    const centerX = token.x + gridSize / 2;
    const centerY = token.y + gridSize / 2;
    setMovePlan({
      token,
      startX: centerX,
      startY: centerY,
      currentX: token.x,
      currentY: token.y,
    });
    callbacks.onCloseMenus();
  };

  return {
    interactionHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
    interactionState: {
      rulerStart,
      rulerEnd,
      isDrawing,
      currentLine,
      movePlan,
    },
    actions: {
      startMove,
      setMovePlan, // caso precise limpar manualmente
    },
  };
};