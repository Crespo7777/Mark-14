import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapToken } from "@/types/map-types";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useTableRealtime = (tableId: string) => {
  const queryClient = useQueryClient();
  // Usamos useRef para manter o controlo do canal entre renderizações
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!tableId) return;

    // Função de limpeza robusta
    const cleanup = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    cleanup(); // Limpa resíduos antes de iniciar

    const channel = supabase
      .channel(`table-updates:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Escuta tudo: INSERT, UPDATE, DELETE
          schema: "public",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          const { table, eventType, new: newRecord, old: oldRecord } = payload;

          // ========================================================
          // 1. OTIMIZAÇÃO CRÍTICA PARA O MAPA (TOKENS)
          // ========================================================
          // Mantemos a tua lógica original de atualização local para performance máxima
          if (table === "map_tokens") {
            queryClient.setQueryData(
              ["map_tokens", tableId],
              (oldTokens: MapToken[] | undefined) => {
                const currentTokens = oldTokens || [];

                if (eventType === "INSERT" && newRecord) {
                  return [...currentTokens, newRecord as MapToken];
                }

                if (eventType === "DELETE" && oldRecord) {
                  return currentTokens.filter((t) => t.id !== oldRecord.id);
                }

                if (eventType === "UPDATE" && newRecord) {
                  return currentTokens.map((t) =>
                    t.id === newRecord.id ? { ...t, ...(newRecord as MapToken) } : t
                  );
                }

                return currentTokens;
              }
            );
            return; // Não fazemos invalidateQueries para tokens (evita piscar)
          }

          // ========================================================
          // 2. OUTRAS TABELAS (Invalidação Segura)
          // ========================================================
          const invalidationMap: Record<string, string[]> = {
            characters: ["characters", tableId],
            character_folders: ["character_folders", tableId],
            npcs: ["npcs", tableId],
            npc_folders: ["npc_folders", tableId],
            journal_entries: ["journal", tableId],
            journal_folders: ["journal_folders", tableId],
            map_fog: ["map_fog", tableId],
            combatants: ["combatants", tableId],
            // Adicionado para garantir redundância no chat
            chat_messages: ["chat_messages", tableId], 
          };

          if (invalidationMap[table]) {
            // console.log(`🔄 Atualizando: ${table}`);
            queryClient.invalidateQueries({ queryKey: invalidationMap[table] });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Conectado com sucesso
        }
        if (status === "CHANNEL_ERROR") {
          console.warn("⚠️ Aviso Realtime: Reconectando...");
        }
      });

    channelRef.current = channel;

    // Limpeza ao desmontar o componente
    return () => {
      cleanup();
    };
  }, [tableId, queryClient]);
};