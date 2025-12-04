import { Shuffle, Layers, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface DeckHolderProps {
  x: number;
  y: number;
  label?: string;
  onShuffle: () => void;
  onGather: () => void;
  onDeal: (count: number) => void;
}

export function DeckHolder({ x, y, label = "Baralho", onShuffle, onGather, onDeal }: DeckHolderProps) {
  const [dealCount, setDealCount] = useState("5");

  return (
    <div 
      className="absolute w-32 h-44 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 group hover:border-amber-500/50 transition-all select-none z-0"
      style={{ left: x, top: y }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
        <Layers className="w-16 h-16" />
      </div>

      <span className="text-white/20 font-bold uppercase tracking-widest text-xs group-hover:text-amber-500/80 z-10">{label}</span>
      
      {/* Menu de Ações (Hover) */}
      <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-2 transition-opacity z-50 transform scale-90 group-hover:scale-100 pointer-events-auto">
        
        <Button size="sm" variant="secondary" className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-white shadow-lg border border-slate-600" onClick={(e) => { e.stopPropagation(); onShuffle(); }} title="Embaralhar">
            <Shuffle className="w-3 h-3 mr-1" /> Mix
        </Button>

        <Popover>
            <PopoverTrigger asChild>
                <Button size="sm" variant="secondary" className="h-7 text-xs bg-amber-700 hover:bg-amber-600 text-white shadow-lg border border-amber-500" onClick={(e) => e.stopPropagation()}>
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Dar
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-slate-900 border-slate-700 p-2 z-[60]">
                <div className="flex gap-2 items-center">
                    <Input 
                        type="number" 
                        value={dealCount} 
                        onChange={(e) => setDealCount(e.target.value)} 
                        className="h-8 w-16 bg-black text-white border-slate-600"
                    />
                    <span className="text-xs text-slate-400">cartas cada</span>
                </div>
                <Button className="w-full mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-500" onClick={() => onDeal(parseInt(dealCount) || 1)}>
                    Confirmar
                </Button>
            </PopoverContent>
        </Popover>

      </div>
    </div>
  );
}