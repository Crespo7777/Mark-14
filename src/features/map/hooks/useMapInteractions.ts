// src/features/map/hooks/useMapInteractions.ts

import { useState, useEffect } from "react";
import { KonvaEventObject } from "konva/lib/Node";
import { MapToken } from "@/types/map-types";

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
  callbacks: {
    onPing: (x: number, y: number) => void;
    onFogCreate: (points: number[]) => void;
    onMoveConfirm: (token: MapToken, x: number, y: number) => void;
    onSelectToken: (id: string | null) => void;
    onCloseMenus: () => void;
    onToolReset: () => void;
  };
}

// Helper para gerar pontos de um círculo (polígono aproximado)
const generateCirclePoints = (centerX: number, centerY: number, radius: number, steps = 64) => {
    const points: number[] = [];
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        points.push(centerX + Math.cos(angle) * radius);
        points.push(centerY + Math.sin(angle) * radius);
    }
    return points;
};

export const useMapInteractions = ({
  stageRef,
  activeTool,
  gridSize,
  isMaster,
  callbacks,
}: UseMapInteractionsProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]); 
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);

  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ x: number; y: number } | null>(null);
  const [measurePath, setMeasurePath] = useState<{ x: number; y: number }[]>([]);
  
  const [movePlan, setMovePlan] = useState<MovePlan | null>(null);

  // --- CANCELAMENTO COM ESC ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawing(false);
        setCurrentPoints([]);
        setShapeStart(null);
        setRulerStart(null);
        setRulerEnd(null);
        setMeasurePath([]);
        setMovePlan(null);
        callbacks.onCloseMenus();
        callbacks.onToolReset(); 
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callbacks]);

  const getPos = (e: any) => {
      const stage = e.target.getStage();
      return stage?.getRelativePointerPosition();
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const pos = getPos(e);
    if (!pos) return;

    // 1. PING
    if (e.evt.button === 1 || (activeTool === "ping" && e.evt.button === 0)) {
      e.evt.preventDefault();
      callbacks.onPing(pos.x, pos.y);
      return;
    }

    // 2. Mover Token
    if (movePlan && e.evt.button === 0) {
      callbacks.onMoveConfirm(movePlan.token, movePlan.currentX, movePlan.currentY);
      setMovePlan(null);
      return;
    }

    // 3. Limpar Seleção
    if (e.target === e.target.getStage()) {
      callbacks.onSelectToken(null);
      callbacks.onCloseMenus();
    }

    // 4. Régua
    if (activeTool === "measure") {
      if (e.evt.button === 0) { 
        if (measurePath.length === 0) {
           setMeasurePath([pos, pos]);
        } else {
           setMeasurePath(prev => [...prev, pos]);
        }
      } else if (e.evt.button === 2) { 
        setMeasurePath([]);
      }
      return;
    }

    // 5. FERRAMENTAS DE NEVOEIRO (GM)
    if (!isMaster) return;

    // Pincel Livre (Lanterna)
    if (activeTool === "reveal" && e.evt.button === 0) {
      setIsDrawing(true);
      setCurrentPoints([pos.x, pos.y]);
    }

    // Formas: Retângulo e Círculo (Início do Drag)
    if ((activeTool === "reveal-rect" || activeTool === "reveal-circle") && e.evt.button === 0) {
        setIsDrawing(true);
        setShapeStart({ x: pos.x, y: pos.y });
        setCurrentPoints([pos.x, pos.y]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const pos = getPos(e);
    if (!pos) return;

    // Atualizar Régua
    if (activeTool === "measure" && measurePath.length > 0) {
      setMeasurePath(prev => {
        const newPath = [...prev];
        newPath[newPath.length - 1] = pos;
        return newPath;
      });
    }

    // Atualizar Ghost Token
    if (movePlan) {
      const snapX = Math.round(pos.x / gridSize) * gridSize;
      const snapY = Math.round(pos.y / gridSize) * gridSize;
      setMovePlan((prev) => prev ? { ...prev, currentX: snapX, currentY: snapY } : null);
    }

    // Atualizar Desenho
    if (isDrawing) {
        if (activeTool === "reveal") {
            // Pincel: Rastro livre
            setCurrentPoints((prev) => [...prev, pos.x, pos.y]);
        } 
        else if (activeTool === "reveal-rect" && shapeStart) {
            // Retângulo: 4 cantos
            const x1 = shapeStart.x;
            const y1 = shapeStart.y;
            const x2 = pos.x;
            const y2 = pos.y;
            setCurrentPoints([x1, y1, x2, y1, x2, y2, x1, y2]);
        }
        else if (activeTool === "reveal-circle" && shapeStart) {
            // Círculo: Calcular raio e gerar polígono
            const radius = Math.sqrt(Math.pow(pos.x - shapeStart.x, 2) + Math.pow(pos.y - shapeStart.y, 2));
            const circlePoints = generateCirclePoints(shapeStart.x, shapeStart.y, radius);
            setCurrentPoints(circlePoints);
        }
    }
  };

  const handleMouseUp = () => {
    // Finalizar Desenho (Pincel, Retângulo, Círculo)
    if (isDrawing && ["reveal", "reveal-rect", "reveal-circle"].includes(activeTool)) {
      setIsDrawing(false);
      setShapeStart(null);

      if (currentPoints.length >= 4) {
        callbacks.onFogCreate(currentPoints);
      }
      setCurrentPoints([]);
    }
  };

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
      measurePath,
      isDrawing,
      currentPoints,
      movePlan,
    },
    actions: {
      startMove,
      setMovePlan,
    },
  };
};