import { useState, useRef, useEffect } from "react";
import { GameCard } from "./types";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { RotateCw, Eye, EyeOff } from "lucide-react";

interface PlayingCardProps {
  card: GameCard;
  onMove: (id: string, x: number, y: number) => void;
  onFlip: (card: GameCard) => void;
  onRotate?: (card: GameCard) => void; // Nova prop
  onHover?: (url: string | null) => void; // Nova prop para o Inspector
}

export function PlayingCard({ card, onMove, onFlip, onRotate, onHover }: PlayingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState({ x: card.position_x, y: card.position_y });
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) setLocalPos({ x: card.position_x, y: card.position_y });
  }, [card.position_x, card.position_y, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Só botão esquerdo arrasta
    e.stopPropagation(); e.preventDefault();
    setIsDragging(true);
    offset.current = { x: e.clientX - localPos.x, y: e.clientY - localPos.y };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    setLocalPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onMove(card.id, e.clientX - offset.current.x, e.clientY - offset.current.y);
  };

  // Inspector Logic
  const handleMouseEnter = () => {
      // Se a carta está virada para cima, mostra a frente. Se não, mostra o verso.
      const imgToShow = card.is_face_up ? card.front_image : card.back_image;
      if (onHover) onHover(imgToShow);
  };

  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <div
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => onHover && onHover(null)}
              onClick={(e) => { if (!isDragging) onFlip(card); }}
              className={cn(
                "absolute w-24 h-36 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-md rounded-lg",
                isDragging ? "z-[9999] scale-110 shadow-2xl" : ""
              )}
              style={{
                left: localPos.x,
                top: localPos.y,
                zIndex: isDragging ? 9999 : card.z_index,
                // Rotação: 0 ou 90 graus (Tap) + Flip 3D
                transform: `rotate(${card.is_tapped ? 90 : 0}deg)`,
                perspective: "1000px"
              }}
            >
              <div className={cn(
                "relative w-full h-full duration-500 transform-style-3d transition-all",
                card.is_face_up ? "rotate-y-180" : ""
              )}
              style={{ transformStyle: "preserve-3d", transform: card.is_face_up ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Verso */}
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/20 bg-cover bg-center shadow-md bg-slate-800"
                  style={{ backgroundImage: `url(${card.back_image})`, backfaceVisibility: "hidden" }}
                />
                {/* Frente */}
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/20 bg-cover bg-center shadow-md bg-white"
                  style={{ backgroundImage: `url(${card.front_image})`, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                />
              </div>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-slate-900 border-slate-700 text-white">
            <ContextMenuItem onClick={() => onFlip(card)}>
                {card.is_face_up ? <><EyeOff className="w-4 h-4 mr-2"/> Virar para Baixo</> : <><Eye className="w-4 h-4 mr-2"/> Revelar</>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRotate && onRotate(card)}>
                <RotateCw className="w-4 h-4 mr-2"/> {card.is_tapped ? "Desvirar (Untap)" : "Virar (Tap)"}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}