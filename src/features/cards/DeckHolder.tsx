import { Layers } from "lucide-react";

interface DeckHolderProps {
  x: number;
  y: number;
  label?: string;
}

export function DeckHolder({ x, y, label = "Baralho" }: DeckHolderProps) {
  return (
    <div 
      className="absolute w-32 h-44 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 group hover:border-amber-500/50 transition-all select-none z-0 pointer-events-none"
      style={{ left: x, top: y }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity">
        <Layers className="w-16 h-16" />
      </div>
      <span className="text-white/20 font-bold uppercase tracking-widest text-xs group-hover:text-amber-500/80 z-10">{label}</span>
    </div>
  );
}