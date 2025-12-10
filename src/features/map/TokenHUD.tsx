// src/features/map/TokenHUD.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Skull, ShieldAlert, Swords, Footprints, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTableContext } from "@/features/table/TableContext";
import { MapToken } from "@/types/map-types";

interface TokenHUDProps {
  tokenId: string; // Agora recebemos apenas o ID
  position: { x: number; y: number };
  onClose: () => void;
  onStartMove: () => void;
}

export const TokenHUD = ({ tokenId, position, onClose, onStartMove }: TokenHUDProps) => {
  const { tableId } = useTableContext();
  const queryClient = useQueryClient();
  const [loadingCombat, setLoadingCombat] = useState(false);

  // 1. Ler o token "Vivo" da Cache (Sincronizado via Realtime)
  const tokens = queryClient.getQueryData<MapToken[]>(["map_tokens", tableId]) || [];
  const token = tokens.find((t) => t.id === tokenId);

  // Se o token não existir (foi apagado), fecha o menu
  if (!token) {
    onClose();
    return null;
  }

  // Helper para verificar status
  const hasStatus = (status: string) => (token.status_effects || []).includes(status);

  // --- FUNÇÃO DE ATUALIZAÇÃO OTIMISTA ---
  const optimisticUpdate = async (updates: Partial<MapToken>) => {
    // 1. Atualizar Cache Imediatamente (UI Instantânea)
    queryClient.setQueryData<MapToken[]>(["map_tokens", tableId], (old) => {
      if (!old) return [];
      return old.map((t) => (t.id === tokenId ? { ...t, ...updates } : t));
    });

    // 2. Enviar para o Servidor em Background
    const { error } = await supabase
      .from("map_tokens")
      .update(updates)
      .eq("id", tokenId)
      .eq("table_id", tableId);

    if (error) {
      console.error("Erro ao atualizar token:", error);
      // Opcional: Reverter cache em caso de erro (Rollback)
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    }
  };

  const toggleHidden = () => optimisticUpdate({ is_hidden: !token.is_hidden });

  const toggleStatusEffect = (status: string) => {
    const currentEffects = new Set(token.status_effects || []);
    if (currentEffects.has(status)) {
      currentEffects.delete(status);
    } else {
      currentEffects.add(status);
    }
    optimisticUpdate({ status_effects: Array.from(currentEffects) });
  };

  // --- LÓGICA DE COMBATE (Híbrida: Otimista + Verificação) ---
  const toggleCombatState = async () => {
    // Otimista Visual: Já mostra o ícone de carregamento ou troca o estado visualmente
    setLoadingCombat(true);
    
    const isInCombat = hasStatus("combat");
    const newEffects = new Set(token.status_effects || []);
    
    // Atualização Visual Imediata (Tira/Põe o ícone)
    if (isInCombat) newEffects.delete("combat");
    else newEffects.add("combat");
    
    // Aplica visualmente já
    queryClient.setQueryData<MapToken[]>(["map_tokens", tableId], (old) => {
        if (!old) return [];
        return old.map((t) => (t.id === tokenId ? { ...t, status_effects: Array.from(newEffects) } : t));
    });

    try {
      if (isInCombat) {
        // Remover do Combate
        await supabase.from("combatants").delete().eq("token_id", tokenId);
      } else {
        // Adicionar ao Combate
        // Verifica se já existe para evitar duplicatas (Segurança)
        const { data: existing } = await supabase
          .from("combatants")
          .select("id")
          .eq("token_id", tokenId)
          .maybeSingle();

        if (!existing) {
          await supabase.from("combatants").insert({
            table_id: tableId,
            token_id: tokenId,
            character_id: token.character_id,
            name: token.label,
            initiative: 0, // Iniciativa padrão
          });
        }
      }

      // Persistir o status visual no token
      await supabase
        .from("map_tokens")
        .update({ status_effects: Array.from(newEffects) })
        .eq("id", tokenId);

      // Atualizar lista de combatentes
      queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });

    } catch (error) {
      console.error("Erro no combate:", error);
      // Reverter visual em caso de erro
      queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    } finally {
      setLoadingCombat(false);
    }
  };

  return (
    <div
      className="absolute z-50 flex flex-col gap-1 p-1 bg-black/90 border border-white/20 rounded-md shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 origin-bottom"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%) translateY(-10px)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()} // Previne menu nativo sobre o HUD
    >
      <div className="flex items-center gap-1">
        {/* Mover */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
          onClick={() => {
            onStartMove();
            onClose();
          }}
          title="Mover"
        >
          <Footprints className="w-4 h-4" />
        </Button>

        <div className="w-px h-5 bg-white/10 mx-0.5" />

        {/* Visibilidade */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 rounded-sm transition-colors ${
            token.is_hidden ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "hover:bg-white/20"
          }`}
          onClick={toggleHidden}
          title="Visibilidade"
        >
          {token.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>

        <div className="w-px h-5 bg-white/10 mx-0.5" />

        {/* Morto */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 rounded-sm transition-colors ${
            hasStatus("dead") ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "hover:bg-white/20"
          }`}
          onClick={() => toggleStatusEffect("dead")}
          title="Morto"
        >
          <Skull className="w-4 h-4" />
        </Button>

        {/* Ferido */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 rounded-sm transition-colors ${
            hasStatus("bloodied") ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30" : "hover:bg-white/20"
          }`}
          onClick={() => toggleStatusEffect("bloodied")}
          title="Ensanguentado"
        >
          <ShieldAlert className="w-4 h-4" />
        </Button>

        {/* Combate */}
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 rounded-sm transition-colors ${
            hasStatus("combat") ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" : "hover:bg-white/20"
          }`}
          onClick={toggleCombatState}
          disabled={loadingCombat}
          title="Combate"
        >
          {loadingCombat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
        </Button>
      </div>

      <div className="text-[10px] text-center text-muted-foreground font-mono mt-1 px-1 border-t border-white/10 pt-1 truncate max-w-[160px]">
        {token.label}
      </div>
    </div>
  );
};