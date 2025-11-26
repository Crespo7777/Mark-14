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

// Tamanho da grelha visual em pixels (igual ao definido no SceneBoard)
const GRID_SIZE_PX = 50;
// Escala de distância: 1 quadrado = 1.5 metros
const METERS_PER_GRID = 1.5;

export const MapToken = ({ token, isDraggable, onUpdatePosition, onDelete, containerRef }: MapTokenProps) => {
  const [position, setPosition] = useState({ x: token.x, y: token.y });
  const [isDragging, setIsDragging] = useState(false);
  // Guardar a posição inicial para a régua
  const [startDragPos, setStartDragPos] = useState<{x: number, y: number} | null>(null);
  const [measurement, setMeasurement] = useState<string | null>(null);
  
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
    setStartDragPos({ x: position.x, y: position.y }); // Guarda onde começou
    
    const container = containerRef.current;
    if (!container) return;

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Calcular nova posição em % relativo ao container
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Limites (0 a 100)
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setPosition({ x: newX, y: newY });

    // --- CÁLCULO DA RÉGUA ---
    if (startDragPos) {
        // Converter % para Pixels para calcular distância real
        const dxPx = ((newX - startDragPos.x) / 100) * rect.width;
        const dyPx = ((newY - startDragPos.y) / 100) * rect.height;
        
        // Distância euclidiana em pixels
        const distPx = Math.sqrt(dxPx*dxPx + dyPx*dyPx);
        
        // Converter para metros de jogo
        const squares = distPx / GRID_SIZE_PX;
        const meters = squares * METERS_PER_GRID;
        
        // Só mostra se moveu um pouco
        if (distPx > 10) {
            setMeasurement(`${meters.toFixed(1)}m`);
        } else {
            setMeasurement(null);
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // --- LÓGICA DE GRID SNAPPING ---
    let finalX = position.x;
    let finalY = position.y;

    // Se NÃO estiver a segurar SHIFT, aplica o "imã"
    if (!e.shiftKey) {
        // 1. Converter % atual para Pixels
        const currentXpx = (finalX / 100) * rect.width;
        const currentYpx = (finalY / 100) * rect.height;

        // 2. Arredondar para o múltiplo de 50px mais próximo (Centro da grelha)
        // Adicionamos 25px (metade da grelha) se quisermos centrar nas linhas, 
        // ou usamos math.round simples para centrar no quadrado.
        // Vamos assumir que (0,0) é o canto.
        const snappedXpx = Math.round(currentXpx / GRID_SIZE_PX) * GRID_SIZE_PX;
        const snappedYpx = Math.round(currentYpx / GRID_SIZE_PX) * GRID_SIZE_PX;

        // 3. Converter de volta para %
        finalX = (snappedXpx / rect.width) * 100;
        finalY = (snappedYpx / rect.height) * 100;
        
        // Atualiza estado local para o utilizador ver o "salto" imediatamente
        setPosition({ x: finalX, y: finalY });
    }

    setIsDragging(false);
    setStartDragPos(null);
    setMeasurement(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Salvar no servidor
    onUpdatePosition(token.id, finalX, finalY);
  };

  // Determinar Nome e Imagem
  let displayName = token.label || "Token";
  let displayImage = token.custom_image_url;

  if (token.character) {
      displayName = token.character.name;
  } else if (token.npc) {
      displayName = token.npc.name;
  }

  // Calcular tamanho
  const baseSize = 6; // %
  const sizePercent = baseSize * (token.scale || 1);

  return (
    <>
        {/* RÉGUA (Linha e Texto) - Só aparece enquanto arrasta */}
        {isDragging && startDragPos && (
            <div className="absolute inset-0 pointer-events-none z-40">
                {/* SVG para desenhar a linha */}
                <svg className="w-full h-full overflow-visible">
                    <line 
                        x1={`${startDragPos.x}%`} 
                        y1={`${startDragPos.y}%`} 
                        x2={`${position.x}%`} 
                        y2={`${position.y}%`} 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeDasharray="5,5" 
                        className="drop-shadow-md"
                    />
                </svg>
                
                {/* Etiqueta de Distância */}
                {measurement && (
                    <div 
                        className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded-full border border-white/20 shadow-xl font-mono z-50"
                        style={{ 
                            left: `${(startDragPos.x + position.x) / 2}%`, 
                            top: `${(startDragPos.y + position.y) / 2}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {measurement}
                    </div>
                )}
            </div>
        )}

        {/* O TOKEN */}
        <div
          ref={tokenRef}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none z-20 transition-transform hover:scale-110 hover:z-30",
            isDragging ? "z-50 scale-110 cursor-grabbing" : "transition-all duration-300 ease-out" // Animação suave ao soltar (snap)
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
    </>
  );
};