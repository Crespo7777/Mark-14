import { useState, useRef, useEffect } from "react";
import { GameCard } from "./types";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { RotateCw, Eye, EyeOff, ArrowUpCircle } from "lucide-react";

interface PlayingCardProps {
  card: GameCard;
  isInHand?: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onFlip: (card: GameCard) => void;
  onRotate?: (card: GameCard) => void;
  onPlay?: (card: GameCard) => void;
}

export function PlayingCard({ card, isInHand = false, onMove, onFlip, onRotate, onPlay }: PlayingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState({ x: card.position_x, y: card.position_y });
  
  const offset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Só atualiza a posição se estiver na mesa. Na mão, o Flexbox manda.
    if (!isDragging && !isInHand) {
        setLocalPos({ x: card.position_x, y: card.position_y });
    }
  }, [card.position_x, card.position_y, isDragging, isInHand]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Se estiver na mão, ao começar a arrastar, a posição inicial é onde o mouse está
    if (isInHand) {
        setLocalPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    }

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
    
    const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.current.x, 2) + Math.pow(e.clientY - dragStartPos.current.y, 2));
    
    if (dist < 5) {
        // Clique rápido
        if (isInHand && onPlay) onPlay(card);
        else onFlip(card);
    } else {
        // Arrastou
        onMove(card.id, e.clientX - offset.current.x, e.clientY - offset.current.y);
    }
  };

  const getStyle = () => {
    // 1. Arrastando (prioridade total)
    if (isDragging) {
        return {
            position: 'fixed' as const,
            left: localPos.x,
            top: localPos.y,
            zIndex: 9999,
            transform: 'scale(1.1) rotate(5deg)',
            cursor: 'grabbing',
            pointerEvents: 'none' as const 
        };
    }

    // 2. Na Mão (Leque)
    if (isInHand) {
        return {
            position: 'relative' as const,
            transform: 'translateY(0)',
            zIndex: 1,
            cursor: 'grab',
            transition: 'all 0.2s ease-out'
        };
    }

    // 3. Na Mesa
    return {
        position: 'absolute' as const,
        left: localPos.x,
        top: localPos.y,
        zIndex: card.z_index,
        transform: `rotate(${card.is_tapped ? 90 : 0}deg)`,
        perspective: "1000px",
        cursor: 'grab',
        transition: 'transform 0.2s'
    };
  };

  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "w-24 h-36 rounded-lg shadow-md select-none border border-black/20",
                // Estilo "Leque" com margem negativa suave
                !isDragging && isInHand ? "hover:-translate-y-8 hover:z-50 hover:scale-110 mx-[-15px] first:mx-0 shadow-xl" : ""
              )}
              style={getStyle()}
            >
              <div className={cn(
                "relative w-full h-full duration-500 transform-style-3d transition-all",
                card.is_face_up ? "rotate-y-180" : ""
              )}
              style={{ transformStyle: "preserve-3d", transform: card.is_face_up ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/10 bg-cover bg-center shadow-inner bg-slate-800"
                  style={{ backgroundImage: `url(${card.back_image})`, backfaceVisibility: "hidden" }}
                />
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/10 bg-cover bg-center shadow-inner bg-white"
                  style={{ backgroundImage: `url(${card.front_image})`, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                />
              </div>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-slate-900 border-slate-700 text-white z-[9999]">
            <ContextMenuItem onClick={() => isInHand && onPlay ? onPlay(card) : onFlip(card)}>
                {isInHand ? <><ArrowUpCircle className="w-4 h-4 mr-2"/> Jogar na Mesa</> : (card.is_face_up ? "Virar para Baixo" : "Revelar")}
            </ContextMenuItem>
            {!isInHand && (
                <ContextMenuItem onClick={() => onRotate && onRotate(card)}>
                    <RotateCw className="w-4 h-4 mr-2"/> {card.is_tapped ? "Desvirar" : "Virar (Tap)"}
                </ContextMenuItem>
            )}
        </ContextMenuContent>
    </ContextMenu>
  );
}