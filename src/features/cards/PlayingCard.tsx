import { useState, useRef } from "react";
import { GameCard } from "./types";
import { cn } from "@/lib/utils";

interface PlayingCardProps {
  card: GameCard;
  onMove: (id: string, x: number, y: number) => void;
  onFlip: (card: GameCard) => void;
}

export function PlayingCard({ card, onMove, onFlip }: PlayingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  // Lógica de arrastar manual para controle total
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Não mover o mapa do VTT
    e.preventDefault();
    setIsDragging(true);
    
    // Calcula onde clicamos na carta relativamento ao seu canto
    offset.current = {
      x: e.clientX - card.position_x,
      y: e.clientY - card.position_y
    };

    // Adiciona listeners globais para o movimento fluir mesmo se o mouse sair da carta
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newX = e.clientX - offset.current.x;
    const newY = e.clientY - offset.current.y;
    onMove(card.id, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
          if(!isDragging) onFlip(card); // Só vira se for clique rápido, não arrasto
      }}
      className="absolute w-24 h-36 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-xl"
      style={{
        left: card.position_x,
        top: card.position_y,
        zIndex: isDragging ? 9999 : card.z_index, // Traz para frente ao arrastar
        transform: `rotate(${card.is_tapped ? 90 : 0}deg)`,
        perspective: "1000px" // Necessário para o 3D
      }}
    >
      <div className={cn(
        "relative w-full h-full duration-500 transform-style-3d transition-all",
        card.is_face_up ? "rotate-y-180" : ""
      )}
      style={{ transformStyle: "preserve-3d", transform: card.is_face_up ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Verso (Parte de trás) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/20 bg-cover bg-center shadow-md bg-slate-800"
          style={{ 
            backgroundImage: `url(${card.back_image})`, 
            backfaceVisibility: "hidden" 
          }}
        />

        {/* Frente (A arte da carta) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-lg border-2 border-white/20 bg-cover bg-center shadow-md bg-white"
          style={{ 
            backgroundImage: `url(${card.front_image})`, 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        />
      </div>
    </div>
  );
}