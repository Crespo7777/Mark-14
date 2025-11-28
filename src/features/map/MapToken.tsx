// src/features/map/MapToken.tsx

import { useState, useEffect, useRef } from "react";
import { SceneToken } from "@/types/map-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Shield, Skull } from "lucide-react";

interface MapTokenProps {
  token: SceneToken;
  isDraggable: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDelete?: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const GRID_SIZE_PX = 50;
const METERS_PER_GRID = 1.5;

export const MapToken = ({ token, isDraggable, isSelected, onSelect, onUpdatePosition, onDelete, containerRef }: MapTokenProps) => {
  const [position, setPosition] = useState({ x: token.x, y: token.y });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState<{x: number, y: number} | null>(null);
  const [measurement, setMeasurement] = useState<string | null>(null);
  
  const tokenRef = useRef<HTMLDivElement>(null);

  // Sincronizar posição (Realtime)
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: token.x, y: token.y });
    }
  }, [token.x, token.y, isDragging]);

  // --- Lógica de Dados (HP) ---
  // Tenta ler a estrutura padrão da ficha (Mark-14)
  const charData = token.character?.data || token.npc?.data || {};
  const currentHp = Number(charData.toughness?.current || charData.combat?.toughness_current);
  const maxHp = Number(charData.attributes?.vigorous?.value || 10) + (Number(charData.toughness?.bonus || 0)); // Exemplo de cálculo, ajustável
  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
  const isDead = currentHp <= 0 && maxHp > 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Selecionar ao clicar (mesmo que não possa arrastar)
    onSelect(token.id);

    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setStartDragPos({ x: position.x, y: position.y });
    
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

    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setPosition({ x: newX, y: newY });

    // Régua
    if (startDragPos) {
        const dxPx = ((newX - startDragPos.x) / 100) * rect.width;
        const dyPx = ((newY - startDragPos.y) / 100) * rect.height;
        const distPx = Math.sqrt(dxPx*dxPx + dyPx*dyPx);
        const squares = distPx / GRID_SIZE_PX;
        const meters = squares * METERS_PER_GRID;
        
        if (distPx > 10) setMeasurement(`${meters.toFixed(1)}m`);
        else setMeasurement(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let finalX = position.x;
    let finalY = position.y;

    // Grid Snapping (Shift desativa)
    if (!e.shiftKey) {
        const currentXpx = (finalX / 100) * rect.width;
        const currentYpx = (finalY / 100) * rect.height;
        const snappedXpx = Math.round(currentXpx / GRID_SIZE_PX) * GRID_SIZE_PX;
        const snappedYpx = Math.round(currentYpx / GRID_SIZE_PX) * GRID_SIZE_PX;
        finalX = (snappedXpx / rect.width) * 100;
        finalY = (snappedYpx / rect.height) * 100;
        setPosition({ x: finalX, y: finalY });
    }

    setIsDragging(false);
    setStartDragPos(null);
    setMeasurement(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Evita update se moveu muito pouco (clique simples)
    if (startDragPos && Math.abs(startDragPos.x - finalX) < 0.1 && Math.abs(startDragPos.y - finalY) < 0.1) return;

    onUpdatePosition(token.id, finalX, finalY);
  };

  // Renderização
  let displayName = token.label || (token.character?.name || token.npc?.name || "Token");
  let displayImage = token.custom_image_url; 
  const sizePercent = 6 * (token.scale || 1);

  return (
    <>
        {/* RÉGUA */}
        {isDragging && startDragPos && (
            <div className="absolute inset-0 pointer-events-none z-40">
                <svg className="w-full h-full overflow-visible">
                    <line x1={`${startDragPos.x}%`} y1={`${startDragPos.y}%`} x2={`${position.x}%`} y2={`${position.y}%`} stroke="white" strokeWidth="2" strokeDasharray="5,5" className="drop-shadow-md" />
                </svg>
                {measurement && (
                    <div className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded-full border border-white/20 shadow-xl font-mono z-50 transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${(startDragPos.x + position.x) / 2}%`, top: `${(startDragPos.y + position.y) / 2}%` }}>
                        {measurement}
                    </div>
                )}
            </div>
        )}

        {/* TOKEN */}
        <div
          ref={tokenRef}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center touch-none z-20 transition-transform select-none group",
            isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
            isDragging ? "z-50 scale-110" : "transition-all duration-300 ease-out",
            isDead && "grayscale opacity-80"
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
          onContextMenu={(e) => { e.preventDefault(); if(onDelete) onDelete(token.id); }}
        >
          {/* Anel de Seleção */}
          {isSelected && (
              <div className="absolute -inset-1 rounded-full border-2 border-primary animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)] z-0" />
          )}

          {/* Avatar */}
          <Avatar className="w-full h-full border-2 border-white shadow-lg ring-1 ring-black/50 bg-background relative z-10">
             {displayImage && <AvatarImage src={displayImage} className="object-cover" />}
             <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
             {isDead && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Skull className="w-2/3 h-2/3 text-red-500 opacity-80" /></div>}
          </Avatar>
          
          {/* Barra de Vida (Mini) */}
          {!isNaN(hpPercent) && maxHp > 0 && (
              <div className="absolute -bottom-2 w-[120%] h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10 z-20">
                  <div 
                    className={cn("h-full transition-all duration-500", hpPercent < 30 ? "bg-red-500" : "bg-green-500")} 
                    style={{ width: `${Math.min(100, Math.max(0, hpPercent))}%` }} 
                  />
              </div>
          )}

          {/* Nome (Hover ou Selecionado) */}
          <div className={cn(
              "mt-2.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap max-w-[200%] truncate transition-opacity z-20 backdrop-blur-sm",
              isSelected || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
             {displayName}
          </div>
        </div>
    </>
  );
};