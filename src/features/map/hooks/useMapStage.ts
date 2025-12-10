// src/features/map/hooks/useMapStage.ts

import { useState } from "react";
import { KonvaEventObject } from "konva/lib/Node";

interface UseMapStageProps {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
}

export const useMapStage = ({
  initialScale = 1,
  minScale = 0.1,
  maxScale = 10,
}: UseMapStageProps = {}) => {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(initialScale);

  // Lógica de Zoom focada no ponteiro do rato
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(minScale, Math.min(newScale, maxScale));

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  return {
    stagePos,
    setStagePos,
    stageScale,
    setStageScale,
    handleWheel,
  };
};