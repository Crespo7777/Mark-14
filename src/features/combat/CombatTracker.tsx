// src/features/combat/CombatTracker.tsx

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Trash2, 
    ChevronRight, 
    ChevronLeft,
    RotateCcw, 
    Dices, 
    Shield,
    Swords
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { dispatchFocusEvent } from "@/features/map/hooks/useMapFocus";
import { useToast } from "@/hooks/use-toast";

interface CombatantData {
    id: string;
    token_id: string;
    name: string;
    initiative: number;
    is_turn: boolean;
    character_id: string | null;
    token?: { 
        image_url: string | null; 
        is_hidden: boolean;
        x: number;
        y: number;
    }; 
    character?: { data: any }; 
}

export const CombatTracker = () => {
    const { tableId, isMaster } = useTableContext();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [round, setRound] = useState(1);

    const { data: combatants = [] } = useQuery({
        queryKey: ["combatants", tableId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("combatants")
                .select(`
                    *,
                    token:map_tokens(image_url, is_hidden, x, y), 
                    character:characters(data)
                `)
                .eq("table_id", tableId)
                .order("initiative", { ascending: false });

            if (error) throw error;
            return data as unknown as CombatantData[];
        }
    });

    // --- AÇÕES ---

    const handleFocusToken = (x?: number, y?: number) => {
        if (x === undefined || y === undefined) return;
        dispatchFocusEvent(x, y);
    };

    const handleRollInitiative = async () => {
        toast({ title: "Rolando Iniciativas...", duration: 800 });

        const updates = combatants.map(c => {
            let initValue = 0;
            if (c.character?.data?.attributes) {
                const attrs = c.character.data.attributes;
                const quick = attrs.quick?.value || attrs.quick || 0;
                initValue = Number(quick) + (Math.floor(Math.random() * 20) + 1) + (Math.random() * 0.9);
            } else {
                initValue = (Math.floor(Math.random() * 20) + 1);
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
        
        // Atualização Otimista
        queryClient.setQueryData(["combatants", tableId], (old: CombatantData[] | undefined) => {
            if (!old) return [];
            const updated = old.map(c => c.id === id ? { ...c, initiative: num } : c);
            return updated.sort((a, b) => b.initiative - a.initiative);
        });

        await supabase.from("combatants").update({ initiative: num }).eq("id", id);
    };

    const handleNextTurn = async (direction: 'next' | 'prev') => {
        if (combatants.length === 0) return;
        const currentIndex = combatants.findIndex(c => c.is_turn);
        let nextIndex = 0;

        if (currentIndex !== -1) {
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
        const nextCombatant = combatants[nextIndex];
        
        // Otimista: Atualiza a cache local instantaneamente
        queryClient.setQueryData(["combatants", tableId], (old: CombatantData[] | undefined) => {
            if (!old) return [];
            return old.map((c, idx) => ({ ...c, is_turn: idx === nextIndex }));
        });

        await supabase.from("combatants").update({ is_turn: true }).eq("id", nextCombatant.id);
        
        if (nextCombatant.token) handleFocusToken(nextCombatant.token.x, nextCombatant.token.y);
    };

    return (
        <div className="flex flex-col h-full bg-card select-none text-xs">
            
            {/* --- HEADER --- */}
            <div className="p-2 border-b border-border bg-muted/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    {isMaster ? (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleNextTurn('prev')}>
                            <ChevronLeft className="w-3 h-3" />
                        </Button>
                    ) : <div className="w-5" />}
                    
                    <div className="flex items-center gap-2">
                        <Swords className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Round</span>
                        <span className="font-black text-primary text-base">{round}</span>
                    </div>

                    {isMaster ? (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleNextTurn('next')}>
                            <ChevronRight className="w-3 h-3" />
                        </Button>
                    ) : <div className="w-5" />}
                </div>

                {isMaster && (
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="flex-1 h-6 text-[10px] border-dashed" onClick={handleRollInitiative}>
                            <Dices className="w-3 h-3 mr-1" /> Rolar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRound(1)} title="Reset">
                            <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button 
                            variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" 
                            onClick={async () => {
                                queryClient.setQueryData(["combatants", tableId], []);
                                await supabase.from("combatants").delete().eq("table_id", tableId);
                                setRound(1);
                            }} 
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>

            {/* --- LISTA SUPER LIMPA --- */}
            <ScrollArea className="flex-1 bg-background/50">
                <div className="flex flex-col p-1 gap-1">
                    {combatants.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground opacity-50">
                            <Shield className="w-8 h-8 mx-auto mb-1 stroke-1" />
                            <p className="text-[10px]">Vazio</p>
                        </div>
                    ) : (
                        combatants.map((c) => (
                            <div 
                                key={c.id} 
                                className={cn(
                                    "flex items-center gap-2 p-1.5 rounded border transition-all duration-150",
                                    // AQUI ESTÁ A MUDANÇA:
                                    // Removemos "bg-primary/10". Agora é só borda.
                                    c.is_turn 
                                        ? "bg-card border-primary border-l-2 shadow-sm" 
                                        : "bg-card border-border/40",
                                    
                                    c.token?.is_hidden && !isMaster && "hidden", // Esconde ocultos dos jogadores
                                    c.token?.is_hidden && isMaster && "opacity-50 border-dashed" // Mestre vê transparente
                                )}
                            >
                                {/* 1. AVATAR */}
                                <div className="relative">
                                    <Avatar className={cn("h-8 w-8 border shadow-sm", c.is_turn ? "border-primary" : "border-border")}>
                                        <AvatarImage src={c.token?.image_url || ""} className="object-cover" />
                                        <AvatarFallback className="text-[9px] bg-secondary font-bold">
                                            {c.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* 2. NOME (Clicável apenas para focar, sem botões extras) */}
                                <div 
                                    className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer group"
                                    onClick={() => isMaster && handleFocusToken(c.token?.x, c.token?.y)}
                                >
                                    <span className={cn(
                                        "font-bold truncate transition-colors group-hover:text-primary", 
                                        c.is_turn ? "text-primary" : "text-foreground"
                                    )}>
                                        {c.name}
                                    </span>
                                </div>

                                {/* 3. INICIATIVA */}
                                <div className="flex items-center justify-center min-w-[2rem]">
                                    {isMaster ? (
                                        <Input 
                                            className={cn(
                                                "h-6 w-8 p-0 text-center font-mono font-bold text-xs border bg-transparent hover:bg-background focus:bg-background transition-colors",
                                                c.is_turn ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                                            )}
                                            value={c.initiative}
                                            onChange={(e) => handleUpdateInitiative(c.id, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    ) : (
                                        <div className={cn(
                                            "flex items-center justify-center h-6 w-8 rounded border font-mono font-bold text-xs bg-background/30",
                                            c.is_turn ? "border-primary text-primary" : "border-border text-muted-foreground"
                                        )}>
                                            {c.initiative}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            
            {/* RODAPÉ */}
            {isMaster && combatants.length > 0 && (
                <div className="p-2 border-t border-border bg-background shadow-lg z-20">
                    <Button 
                        className="w-full font-bold h-7 text-xs" 
                        onClick={() => handleNextTurn('next')}
                    >
                        Próximo <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};