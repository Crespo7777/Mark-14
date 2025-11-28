// src/features/map/MapCursors.tsx

import { useMemo } from "react";
import { MousePointer2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Cursor {
  x: number;
  y: number;
  userId: string;
  color: string;
  name: string;
  avatarUrl?: string;
}

interface MapCursorsProps {
  cursors: Record<string, Cursor>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const MapCursors = ({ cursors, containerRef }: MapCursorsProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex flex-col items-start transition-all duration-100 ease-linear"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-2px, -2px)' // Ajuste fino para a ponta do cursor
          }}
        >
          <MousePointer2
            className="w-4 h-4 fill-current drop-shadow-md"
            style={{ color: cursor.color }}
          />
          <div
            className="ml-3 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm whitespace-nowrap flex items-center gap-1"
            style={{ backgroundColor: cursor.color }}
          >
             {cursor.avatarUrl && (
                 <Avatar className="w-3 h-3 border border-white/20">
                     <AvatarImage src={cursor.avatarUrl} />
                     <AvatarFallback className="text-[6px]">{cursor.name[0]}</AvatarFallback>
                 </Avatar>
             )}
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
};