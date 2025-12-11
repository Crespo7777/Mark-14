// src/features/map/TokenHUD.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Skull, ShieldAlert, Swords, Footprints, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTableContext } from "@/features/table/TableContext";
import { MapToken } from "@/types/map-types";

interface TokenHUDProps {
  tokenId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onStartMove: () => void;
}

export const TokenHUD = ({ tokenId, position, onClose, onStartMove }: TokenHUDProps) => {
  const { tableId } = useTableContext();
  const queryClient = useQueryClient();
  const [loadingCombat, setLoadingCombat] = useState(false);

  // 1. Ler o token "Vivo" da Cache
  const tokens = queryClient.getQueryData<MapToken[]>(["map_tokens", tableId]) || [];
  const token = tokens.find((t) => t.id === tokenId);

  if (!token) {
    onClose();
    return null;
  }

  const hasStatus = (status: string) => (token.status_effects || []).includes(status);

  // --- FUNÇÃO DE ATUALIZAÇÃO OTIMISTA ---
  const optimisticUpdateToken = async (updates: Partial<MapToken>) => {
    queryClient.setQueryData<MapToken[]>(["map_tokens", tableId], (old) => {
      if (!old) return [];
      return old.map((t) => (t.id === tokenId ? { ...t, ...updates } : t));
    });

    await supabase.from("map_tokens").update(updates).eq("id", tokenId).eq("table_id", tableId);
  };

  // --- REMOVER TOKEN ---
  const deleteToken = async () => {
      onClose(); // Fecha o menu imediatamente
      
      // 1. Remove visualmente (Otimista)
      queryClient.setQueryData<MapToken[]>(["map_tokens", tableId], (old) => {
          return old?.filter(t => t.id !== tokenId) || [];
      });

      // 2. Remove do banco
      const { error } = await supabase.from("map_tokens").delete().eq("id", tokenId).eq("table_id", tableId);
      
      if (error) {
          console.error("Erro ao apagar token:", error);
          // Revalida em caso de erro para trazer o token de volta
          queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
      }
  };

  // --- AÇÕES ---
  const toggleHidden = () => optimisticUpdateToken({ is_hidden: !token.is_hidden });

  const toggleStatusEffect = (status: string) => {
    const currentEffects = new Set(token.status_effects || []);
    if (currentEffects.has(status)) currentEffects.delete(status);
    else currentEffects.add(status);
    optimisticUpdateToken({ status_effects: Array.from(currentEffects) });
  };

  const toggleCombatState = async () => {
    setLoadingCombat(true);
    const isInCombat = hasStatus("combat");
    const newEffects = new Set(token.status_effects || []);
    
    if (isInCombat) newEffects.delete("combat");
    else newEffects.add("combat");
    
    queryClient.setQueryData<MapToken[]>(["map_tokens", tableId], (old) => {
        if (!old) return [];
        return old.map((t) => (t.id === tokenId ? { ...t, status_effects: Array.from(newEffects) } : t));
    });

    try {
      if (isInCombat) {
        await supabase.from("combatants").delete().eq("token_id", tokenId);
      } else {
        const { data: existing } = await supabase.from("combatants").select("id").eq("token_id", tokenId).maybeSingle();
        if (!existing) {
          await supabase.from("combatants").insert({
            table_id: tableId,
            token_id: tokenId,
            character_id: token.character_id,
            name: token.label,
            initiative: 0,
          });
        }
      }
      await supabase.from("map_tokens").update({ status_effects: Array.from(newEffects) }).eq("id", tokenId);
      queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCombat(false);
    }
  };

  return (
    <div
      className="absolute z-50 flex flex-col gap-1 p-1.5 bg-black/90 border border-white/20 rounded-md shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 origin-bottom"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1">
        {/* Mover */}
        <Button variant="ghost" size="icon" className="w-7 h-7 rounded hover:bg-blue-500/20 hover:text-blue-400" onClick={() => { onStartMove(); onClose(); }} title="Mover">
          <Footprints className="w-3.5 h-3.5" />
        </Button>
        
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        
        {/* Visibilidade */}
        <Button variant="ghost" size="icon" className={`w-7 h-7 rounded ${token.is_hidden ? "text-red-400 bg-red-900/20" : "hover:bg-white/10"}`} onClick={toggleHidden}>
          {token.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        
        {/* Combate */}
        <Button variant="ghost" size="icon" className={`w-7 h-7 rounded ${hasStatus("combat") ? "text-yellow-400 bg-yellow-900/20" : "hover:bg-white/10"}`} onClick={toggleCombatState} disabled={loadingCombat}>
           {loadingCombat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Swords className="w-3.5 h-3.5" />}
        </Button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        {/* Status */}
        <Button variant="ghost" size="icon" className={`w-7 h-7 rounded ${hasStatus("bloodied") ? "text-orange-500 bg-orange-900/20" : "hover:bg-white/10"}`} onClick={() => toggleStatusEffect("bloodied")}>
          <ShieldAlert className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className={`w-7 h-7 rounded ${hasStatus("dead") ? "text-red-600 bg-red-900/20" : "hover:bg-white/10"}`} onClick={() => toggleStatusEffect("dead")}>
          <Skull className="w-3.5 h-3.5" />
        </Button>

        {/* --- NOVO: REMOVER TOKEN --- */}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-500" 
            onClick={deleteToken}
            title="Remover Token"
        >
            <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="text-[9px] text-center text-muted-foreground font-mono mt-0.5 truncate max-w-[140px] opacity-60">
        {token.label}
      </div>
    </div>
  );
};