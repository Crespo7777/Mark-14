import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CounterProps {
  label: string;
  value: number;
  x: number;
  y: number;
  onChange: (delta: number) => void;
  onDelete?: () => void;
}

export function CounterWidget({ label, value, x, y, onChange, onDelete }: CounterProps) {
  return (
    <div 
      className="absolute flex flex-col items-center gap-1 p-2 bg-slate-900/90 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md select-none group z-10"
      style={{ left: x, top: y }}
    >
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      
      <div className="flex items-center gap-2">
        <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8 rounded-full border-slate-600 bg-slate-800 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400"
            onClick={() => onChange(-1)}
        >
            <Minus className="w-3 h-3" />
        </Button>
        
        <span className="text-xl font-mono font-bold text-white w-8 text-center">{value}</span>
        
        <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8 rounded-full border-slate-600 bg-slate-800 hover:bg-green-900/30 hover:border-green-500/50 hover:text-green-400"
            onClick={() => onChange(1)}
        >
            <Plus className="w-3 h-3" />
        </Button>
      </div>

      {onDelete && (
          <button 
            onClick={onDelete}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
              <Trash2 className="w-3 h-3" />
          </button>
      )}
    </div>
  );
}