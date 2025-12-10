import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapToken } from "@/types/map-types"; // Certifique-se que este tipo existe e corresponde à sua tabela

export const useTableRealtime = (tableId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tableId) return;

    console.log(`🔌 Conectando ao canal realtime da mesa: ${tableId}`);

    const channel = supabase
      .channel(`table-updates:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Escuta INSERT, UPDATE, DELETE
          schema: "public",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          const { table, eventType, new: newRecord, old: oldRecord } = payload;

          // ========================================================
          // 1. OTIMIZAÇÃO CRÍTICA PARA O MAPA (TOKENS)
          // ========================================================
          if (table === "map_tokens") {
            queryClient.setQueryData(
              ["map_tokens", tableId],
              (oldTokens: MapToken[] | undefined) => {
                const currentTokens = oldTokens || [];

                // Caso 1: Novo token adicionado
                if (eventType === "INSERT" && newRecord) {
                  return [...currentTokens, newRecord as MapToken];
                }

                // Caso 2: Token removido
                if (eventType === "DELETE" && oldRecord) {
                  return currentTokens.filter((t) => t.id !== oldRecord.id);
                }

                // Caso 3: Token atualizado (movimento, status, etc.)
                if (eventType === "UPDATE" && newRecord) {
                  return currentTokens.map((t) =>
                    t.id === newRecord.id ? { ...t, ...(newRecord as MapToken) } : t
                  );
                }

                return currentTokens;
              }
            );
            // Retornamos aqui para NÃO invalidar a query e evitar refetch
            return;
          }

          // ========================================================
          // 2. OUTRAS TABELAS (Mantemos Invalidação por Segurança)
          // ========================================================
          // Para dados menos frequentes (fichas, diário), o refetch é aceitável
          // e garante consistência total.
          
          const invalidationMap: Record<string, string[]> = {
            // Personagens
            characters: ["characters", tableId],
            character_folders: ["character_folders", tableId],
            
            // NPCs
            npcs: ["npcs", tableId],
            npc_folders: ["npc_folders", tableId],
            
            // Diário
            journal_entries: ["journal", tableId],
            journal_folders: ["journal_folders", tableId],
            
            // Mapa (Nevoeiro ainda pode ser via refetch pois muda pouco)
            map_fog: ["map_fog", tableId],
            
            // Combate
            combatants: ["combatants", tableId],
          };

          if (invalidationMap[table]) {
            console.log(`🔄 Atualizando dados de: ${table}`);
            queryClient.invalidateQueries({ queryKey: invalidationMap[table] });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime conectado com sucesso!");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Erro na conexão Realtime.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, queryClient]);
};