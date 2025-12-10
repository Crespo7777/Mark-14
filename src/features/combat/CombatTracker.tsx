import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Swords, 
    Trash2, 
    ChevronRight, 
    ChevronLeft,
    RotateCcw, 
    Dices, 
    Skull,
    Shield,
    EyeOff
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Tipagem exata para o Join do Supabase
interface CombatantData {
    id: string;
    token_id: string;
    name: string;
    initiative: number;
    is_turn: boolean;
    character_id: string | null;
    token?: { image_url: string | null; is_hidden: boolean };
    character?: { data: any }; 
}

export const CombatTracker = () => {
    const { tableId, isMaster } = useTableContext();
    const queryClient = useQueryClient();
    
    // Estado local para o contador de Rounds (Turnos)
    // Nota: O ideal seria guardar isto no DB 'tables' também, mas por enquanto local serve.
    const [round, setRound] = useState(1);

    // 1. BUSCAR COMBATENTES (Ordenados por Iniciativa Descendente)
    const { data: combatants = [], isLoading } = useQuery({
        queryKey: ["combatants", tableId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("combatants")
                .select(`
                    *,
                    token:map_tokens(image_url, is_hidden),
                    character:characters(data)
                `)
                .eq("table_id", tableId)
                .order("initiative", { ascending: false }); // Maior primeiro

            if (error) throw error;
            return data as unknown as CombatantData[];
        }
    });

    // --- AÇÕES DO MESTRE ---

    // Rolar Iniciativa (Baseada em Atributo 'Quick')
    const handleRollInitiative = async () => {
        const updates = combatants.map(c => {
            let initValue = 0;
            if (c.character?.data?.attributes) {
                const attrs = c.character.data.attributes;
                // Procura 'quick', 'vigorous', ou usa 0
                const quick = attrs.quick?.value || attrs.quick || attrs.vigorous?.value || 0;
                // Adiciona d20 para desempate se quiseres, aqui usamos valor fixo + random decimal para desempate
                initValue = Number(quick) + (Math.random() * 0.9);
            } else {
                initValue = c.initiative || (Math.floor(Math.random() * 20) + 1);
            }
            return { id: c.id, initiative: Math.round(initValue) };
        });

        for (const update of updates) {
            await supabase.from("combatants").update({ initiative: update.initiative }).eq("id", update.id);
        }
        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
    };

    const handleUpdateInitiative = async (id: string, value: string) => {
        const num = parseInt(value) || 0;
        await supabase.from("combatants").update({ initiative: num }).eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
    };

    const handleNextTurn = async (direction: 'next' | 'prev') => {
        if (combatants.length === 0) return;

        const currentIndex = combatants.findIndex(c => c.is_turn);
        let nextIndex = 0;

        if (currentIndex !== -1) {
            // Desativa o atual
            await supabase.from("combatants").update({ is_turn: false }).eq("id", combatants[currentIndex].id);
            
            if (direction === 'next') {
                nextIndex = currentIndex + 1;
                if (nextIndex >= combatants.length) {
                    nextIndex = 0;
                    setRound(r => r + 1);
                }
            } else {
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) {
                    nextIndex = combatants.length - 1;
                    setRound(r => Math.max(1, r - 1));
                }
            }
        }

        // Ativa o próximo
        await supabase.from("combatants").update({ is_turn: true }).eq("id", combatants[nextIndex].id);
        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
    };

    const handleResetCombat = async () => {
        // Limpa todos os combatentes
        const { error } = await supabase.from("combatants").delete().eq("table_id", tableId);
        if(!error) {
            setRound(1);
            queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
            // Força atualização dos tokens no mapa para remover o ícone de combate
            queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
        }
    };

    const handleRemoveCombatant = async (id: string) => {
        await supabase.from("combatants").delete().eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["combatants", tableId] });
        queryClient.invalidateQueries({ queryKey: ["map_tokens", tableId] });
    };

    return (
        <div className="flex flex-col h-full bg-card">
            
            {/* 1. CABEÇALHO DE CONTROLO DE TURNOS */}
            <div className="p-2 border-b border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between px-2">
                    {isMaster ? (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleNextTurn('prev')}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    ) : <div className="w-6" />}
                    
                    <div className="text-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Encontro</h3>
                        <div className="text-lg font-black leading-none">Turno {round}</div>
                    </div>

                    {isMaster ? (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleNextTurn('next')}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : <div className="w-6" />}
                </div>

                {isMaster && (
                    <div className="flex justify-between gap-1 mt-1">
                        <Button 
                            variant="outline" size="sm" 
                            className="flex-1 text-xs h-7 gap-1 border-dashed"
                            onClick={handleRollInitiative}
                        >
                            <Dices className="w-3 h-3" /> Rolar Todos
                        </Button>
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setRound(1)}
                            title="Resetar Turnos"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={handleResetCombat}
                            title="Encerrar Combate"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* 2. LISTA DE COMBATENTES */}
            <ScrollArea className="flex-1">
                <div className="divide-y divide-border/50">
                    {combatants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3 opacity-50">
                            <Shield className="w-12 h-12 stroke-1" />
                            <p className="text-xs font-medium">O campo de batalha está vazio.</p>
                            {isMaster && <p className="text-[10px]">Use o Token HUD (Clique Direito) para adicionar.</p>}
                        </div>
                    ) : (
                        combatants.map((c) => (
                            <div 
                                key={c.id} 
                                className={cn(
                                    "group flex items-center gap-3 p-2 transition-colors hover:bg-muted/50",
                                    // Highlight se for o turno dele
                                    c.is_turn && "bg-primary/5 border-l-4 border-primary pl-1"
                                )}
                            >
                                {/* Imagem do Token */}
                                <Avatar className={cn("h-10 w-10 border shadow-sm", c.is_turn ? "border-primary ring-2 ring-primary/20" : "border-border")}>
                                    <AvatarImage src={c.token?.image_url || ""} className="object-cover" />
                                    <AvatarFallback className="text-xs bg-secondary">{c.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>

                                {/* Info do Combatente */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-sm font-bold truncate", c.is_turn ? "text-primary" : "text-foreground")}>
                                            {c.name}
                                        </span>
                                        {/* Ícones de Estado */}
                                        {c.token?.is_hidden && (
                                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                       {/* Aqui podemos colocar HP ou AC no futuro */}
                                       <span>Iniciativa:</span>
                                    </div>
                                </div>

                                {/* Input de Iniciativa */}
                                <div className="flex items-center gap-2">
                                    {isMaster ? (
                                        <Input 
                                            className="h-8 w-12 px-1 text-center text-sm font-mono bg-background border-input focus:ring-1" 
                                            value={c.initiative}
                                            onChange={(e) => handleUpdateInitiative(c.id, e.target.value)}
                                            onFocus={(e) => e.target.select()} // Seleciona tudo ao clicar
                                        />
                                    ) : (
                                        <div className="w-12 text-center font-mono text-lg font-bold">{c.initiative}</div>
                                    )}

                                    {/* Botão de Remover (Hover Only) */}
                                    {isMaster && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveCombatant(c.id)}
                                            title="Remover do Combate"
                                        >
                                            <Skull className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            
            {/* Footer / Ações de Turno (Visível sempre) */}
            {isMaster && combatants.length > 0 && (
                <div className="p-2 border-t border-border bg-background">
                    <Button className="w-full font-bold gap-2" onClick={() => handleNextTurn('next')}>
                        Próximo Turno <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};