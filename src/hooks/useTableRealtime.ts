// src/hooks/useTableRealtime.ts

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTableRealtime = (tableId: string) => {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!tableId) return;

		const channel = supabase
			.channel(`table-updates:${tableId}`)
			.on(
				"postgres_changes",
				{
					event: "*", // Escuta INSERT, UPDATE, DELETE
					schema: "public",
					filter: `table_id=eq.${tableId}`, // Apenas eventos desta mesa
				},
				(payload) => {
					const table = payload.table;

					// Mapeamento inteligente: Tabela -> Chave de Cache a invalidar
					
					// 1. PERSONAGENS
					if (table === "characters") {
						queryClient.invalidateQueries({ queryKey: ["characters", tableId] });
					}
					if (table === "character_folders") {
						queryClient.invalidateQueries({ queryKey: ["character_folders", tableId] });
					}

					// 2. NPCS
					if (table === "npcs") {
						queryClient.invalidateQueries({ queryKey: ["npcs", tableId] });
					}
					if (table === "npc_folders") {
						queryClient.invalidateQueries({ queryKey: ["npc_folders", tableId] });
					}

					// 3. DIÁRIO
					if (table === "journal_entries") {
						queryClient.invalidateQueries({ queryKey: ["journal", tableId] });
					}
					if (table === "journal_folders") {
						queryClient.invalidateQueries({ queryKey: ["journal_folders", tableId] });
					}

                    // 4. MAPA (Tokens e Nevoeiro)
                    if (table === "map_tokens") {
                        queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
                    }
                    if (table === "map_fog") {
                        queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] });
                    }

                    // 5. COMBATE (CORREÇÃO CRÍTICA)
                    // Agora ouvimos mudanças na iniciativa e lista de combatentes
                    if (table === "combatants") {
                        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
                    }

					// 6. TABELA E MEMBROS
					if (table === "tables" || table === "table_members") {
						// queryClient.invalidateQueries({ queryKey: ["table-view", tableId] });
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tableId, queryClient]);
};