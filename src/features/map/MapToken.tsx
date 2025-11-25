// src/features/map/MapToken.tsx

import { useState, useEffect, useRef } from "react";
import { SceneToken } from "@/types/map-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MapTokenProps {
  token: SceneToken;
  isDraggable: boolean;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDelete?: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const MapToken = ({ token, isDraggable, onUpdatePosition, onDelete, containerRef }: MapTokenProps) => {
  const [position, setPosition] = useState({ x: token.x, y: token.y });
  const [isDragging, setIsDragging] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Sincronizar com props externas (realtime) se não estiver a arrastar
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: token.x, y: token.y });
    }
  }, [token.x, token.y, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    const container = containerRef.current;
    if (!container) return;

    // Capturar o ponteiro para seguir mesmo fora do elemento
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Calcular nova posição em % relativo ao container
    // Subtraímos o offset inicial do container
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Limites (0 a 100)
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Salvar no servidor apenas no final do movimento
    onUpdatePosition(token.id, position.x, position.y);
  };

  // Determinar Nome e Imagem
  let displayName = token.label || "Token";
  let displayImage = token.custom_image_url;

  // Tenta extrair dados das relações (assumindo que o join traga 'data')
  // Nota: Para simplificar, usamos um fallback visual genérico se não houver imagem
  if (token.character) {
      displayName = token.character.name;
      // Aqui poderíamos extrair imagem do JSON data se existisse um campo 'avatarUrl'
  } else if (token.npc) {
      displayName = token.npc.name;
  }

  // Calcular tamanho (base = 5% da largura do mapa * escala)
  const baseSize = 6; // %
  const sizePercent = baseSize * (token.scale || 1);

  return (
    <div
      ref={tokenRef}
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none z-20 transition-transform hover:scale-110",
        isDragging ? "z-50 scale-110" : ""
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${sizePercent}%`,
        aspectRatio: "1/1"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => {
          e.preventDefault();
          if(onDelete) onDelete(token.id);
      }}
      title={displayName}
    >
      <Avatar className="w-full h-full border-2 border-white shadow-lg ring-2 ring-black/50 pointer-events-none select-none">
         {displayImage && <AvatarImage src={displayImage} className="object-cover" />}
         <AvatarFallback className="bg-primary text-primary-foreground text-[8px] sm:text-xs font-bold truncate">
            {displayName.substring(0, 2).toUpperCase()}
         </AvatarFallback>
      </Avatar>
      
      <div className="mt-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap max-w-[150%] truncate pointer-events-none select-none">
         {displayName}
      </div>
    </div>
  );
};