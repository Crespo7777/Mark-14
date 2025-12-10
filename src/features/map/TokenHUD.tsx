import { MapToken } from "@/types/map-types";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Skull, ShieldAlert, Swords, Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTableContext } from "@/features/table/TableContext";

interface TokenHUDProps {
  token: MapToken;
  position: { x: number; y: number };
  onClose: () => void;
  onStartMove: () => void; // <--- NOVA PROP
}

export const TokenHUD = ({ token, position, onClose, onStartMove }: TokenHUDProps) => {
  const { tableId } = useTableContext();
  const queryClient = useQueryClient();

  const updateToken = async (updates: Partial<MapToken>) => {
    const { error } = await supabase
      .from("map_tokens")
      .update(updates)
      .eq("id", token.id)
      .eq("table_id", tableId);

    if (error) {
      console.error("Erro ao atualizar token:", error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    }
  };

  const toggleHidden = () => updateToken({ is_hidden: !token.is_hidden });
  
  const toggleStatus = (status: string) => {
    const currentEffects = token.status_effects || [];
    let newEffects;
    
    if (currentEffects.includes(status)) {
        newEffects = currentEffects.filter(s => s !== status);
    } else {
        newEffects = [...currentEffects, status];
    }
    
    updateToken({ status_effects: newEffects });
  };

  const hasStatus = (status: string) => (token.status_effects || []).includes(status);

  return (
    <div 
      className="absolute z-50 flex flex-col gap-1 p-1 bg-black/90 border border-white/20 rounded-md shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: "translate(-50%, -100%) translateY(-10px)" 
      }}
      onMouseDown={(e) => e.stopPropagation()} 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        
        {/* NOVA FERRAMENTA: MOVER COM RÉGUA */}
        <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-blue-500/20 hover:text-blue-400"
            onClick={() => {
                onStartMove();
                onClose(); // Fecha o HUD ao iniciar
            }}
            title="Mover com Medição"
        >
            <Footprints className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Visibilidade */}
        <Button 
            variant={token.is_hidden ? "destructive" : "ghost"} 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-white/20" 
            onClick={toggleHidden}
            title={token.is_hidden ? "Revelar para Jogadores" : "Ocultar dos Jogadores"}
        >
            {token.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>

        <div className="w-px h-6 bg-white/20 mx-1" />

        {/* Status: Morto */}
        <Button 
            variant={hasStatus("dead") ? "secondary" : "ghost"} 
            size="icon" 
            className={`w-8 h-8 rounded-sm hover:bg-white/20 ${hasStatus("dead") ? "bg-red-900/50 hover:bg-red-800" : ""}`}
            onClick={() => toggleStatus("dead")}
            title="Marcar como Morto"
        >
            <Skull className={`w-4 h-4 ${hasStatus("dead") ? "text-red-500" : ""}`} />
        </Button>

        {/* Status: Ferido */}
        <Button 
            variant={hasStatus("bloodied") ? "secondary" : "ghost"} 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-white/20"
            onClick={() => toggleStatus("bloodied")}
            title="Ensanguentado"
        >
            <ShieldAlert className={`w-4 h-4 ${hasStatus("bloodied") ? "text-orange-500" : ""}`} />
        </Button>

        {/* Status: Combate */}
        <Button 
            variant={hasStatus("combat") ? "secondary" : "ghost"} 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-white/20"
            onClick={() => toggleStatus("combat")}
            title="Em Combate"
        >
            <Swords className={`w-4 h-4 ${hasStatus("combat") ? "text-yellow-500" : ""}`} />
        </Button>
      </div>
      
      {/* Nome do Token */}
      <div className="text-[10px] text-center text-muted-foreground font-mono mt-1 px-1 border-t border-white/10 pt-1 truncate max-w-[150px]">
        {token.label}
      </div>
    </div>
  );
};