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
					// Isto garante que se a tabela X mudar, a lista X recarrega sozinha.
					
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
						// O diário usa a chave 'journal' para entradas
						queryClient.invalidateQueries({ queryKey: ["journal", tableId] });
					}
					if (table === "journal_folders") {
						queryClient.invalidateQueries({ queryKey: ["journal_folders", tableId] });
					}

                    // 4. TOKENS DO MAPA (Implementação da Estrutura Foundry)
                    // Qualquer mudança nesta tabela força a recarga da lista de tokens.
                    if (table === "map_tokens") {
                        queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
                    }

					// 5. TABELA E MEMBROS (Para kicks e atualizações de nome da mesa)
					if (table === "tables" || table === "table_members") {
						// Aqui podemos invalidar contextos globais se necessário, 
						// mas geralmente o TableContext lida com isso ou forçamos reload da página em casos extremos.
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tableId, queryClient]);
};