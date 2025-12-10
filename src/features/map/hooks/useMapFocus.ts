// src/features/map/hooks/useMapFocus.ts
import { useEffect } from "react";

export const MARK14_EVENTS = {
  FOCUS_TOKEN: "mark14:focus-token",
};

interface FocusEventDetail {
  x: number;
  y: number;
}

interface UseMapFocusProps {
  setStagePos: (pos: { x: number; y: number }) => void;
  setStageScale: (scale: number) => void;
  width: number;
  height: number;
}

export const useMapFocus = ({ setStagePos, setStageScale, width, height }: UseMapFocusProps) => {
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const customEvent = e as CustomEvent<FocusEventDetail>;
      const { x, y } = customEvent.detail;

      // Centraliza o token na tela
      // Fórmula: Centro da Tela - (Posição do Token * Escala)
      const targetScale = 1.5; // Zoom confortável para focar
      
      const newX = (width / 2) - (x * targetScale);
      const newY = (height / 2) - (y * targetScale);

      setStageScale(targetScale);
      setStagePos({ x: newX, y: newY });
    };

    window.addEventListener(MARK14_EVENTS.FOCUS_TOKEN, handleFocus);

    return () => {
      window.removeEventListener(MARK14_EVENTS.FOCUS_TOKEN, handleFocus);
    };
  }, [setStagePos, setStageScale, width, height]);
};

// Helper para disparar o evento (usado pelo Tracker)
export const dispatchFocusEvent = (x: number, y: number) => {
  const event = new CustomEvent(MARK14_EVENTS.FOCUS_TOKEN, {
    detail: { x, y },
  });
  window.dispatchEvent(event);
};