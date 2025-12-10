import { useState } from "react";
import { MapToken } from "@/types/map-types";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Skull, ShieldAlert, Swords, Footprints, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTableContext } from "@/features/table/TableContext";

interface TokenHUDProps {
  token: MapToken;
  position: { x: number; y: number };
  onClose: () => void;
  onStartMove: () => void;
}

export const TokenHUD = ({ token, position, onClose, onStartMove }: TokenHUDProps) => {
  const { tableId } = useTableContext();
  const queryClient = useQueryClient();
  const [loadingCombat, setLoadingCombat] = useState(false);

  // Helper para verificar status
  const hasStatus = (status: string) => (token.status_effects || []).includes(status);

  // Função genérica para atualizar o token
  const updateToken = async (updates: Partial<MapToken>) => {
    const { error } = await supabase
      .from("map_tokens")
      .update(updates)
      .eq("id", token.id)
      .eq("table_id", tableId);

    if (error) {
      console.error("Erro ao atualizar token:", error);
    } else {
      // Força atualização imediata da lista de tokens
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    }
  };

  const toggleHidden = () => updateToken({ is_hidden: !token.is_hidden });
  
  // Função para gerir Status Visuais Genéricos (Dead, Bloodied)
  const toggleStatusEffect = (status: string) => {
    const currentEffects = new Set(token.status_effects || []);
    
    if (currentEffects.has(status)) {
        currentEffects.delete(status);
    } else {
        currentEffects.add(status);
    }
    
    updateToken({ status_effects: Array.from(currentEffects) });
  };

  // --- LÓGICA DE COMBATE ---
  const toggleCombatState = async () => {
    setLoadingCombat(true);
    try {
        // 1. Verificar se já está em combate na tabela real
        const { data: existing } = await supabase
            .from("combatants")
            .select("id")
            .eq("token_id", token.id)
            .maybeSingle();

        // Preparar o novo array de efeitos visuais
        const currentEffects = new Set(token.status_effects || []);

        if (existing) {
            // --- REMOVER ---
            await supabase.from("combatants").delete().eq("id", existing.id);
            currentEffects.delete("combat"); // Remove ícone visual
        } else {
            // --- ADICIONAR ---
            await supabase.from("combatants").insert({
                table_id: tableId,
                token_id: token.id,
                character_id: token.character_id,
                name: token.label,
                initiative: 0
            });
            currentEffects.add("combat"); // Adiciona ícone visual
        }

        // 2. Atualizar o Token com o novo status visual
        await updateToken({ status_effects: Array.from(currentEffects) });

        // 3. Atualizar o Combat Tracker também
        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });

    } catch (error) {
        console.error("Erro ao alternar combate:", error);
    } finally {
        setLoadingCombat(false);
    }
  };

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
        
        {/* Ferramenta: Mover */}
        <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-blue-500/20 hover:text-blue-400"
            onClick={() => {
                onStartMove();
                onClose();
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
            onClick={() => toggleStatusEffect("dead")}
            title="Marcar como Morto"
        >
            <Skull className={`w-4 h-4 ${hasStatus("dead") ? "text-red-500" : ""}`} />
        </Button>

        {/* Status: Ferido */}
        <Button 
            variant={hasStatus("bloodied") ? "secondary" : "ghost"} 
            size="icon" 
            className="w-8 h-8 rounded-sm hover:bg-white/20"
            onClick={() => toggleStatusEffect("bloodied")}
            title="Ensanguentado"
        >
            <ShieldAlert className={`w-4 h-4 ${hasStatus("bloodied") ? "text-orange-500" : ""}`} />
        </Button>

        {/* Status: COMBATE (INTEGRADO) */}
        <Button 
            variant={hasStatus("combat") ? "secondary" : "ghost"} 
            size="icon" 
            className={`w-8 h-8 rounded-sm hover:bg-white/20 ${hasStatus("combat") ? "bg-yellow-500/20 text-yellow-500" : ""}`}
            onClick={toggleCombatState}
            disabled={loadingCombat}
            title={hasStatus("combat") ? "Remover do Combate" : "Adicionar ao Combate"}
        >
            {loadingCombat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
        </Button>
      </div>
      
      <div className="text-[10px] text-center text-muted-foreground font-mono mt-1 px-1 border-t border-white/10 pt-1 truncate max-w-[150px]">
        {token.label}
      </div>
    </div>
  );
};