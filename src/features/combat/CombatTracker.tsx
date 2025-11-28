// src/features/combat/CombatTracker.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, ChevronRight, Plus, Trash2, RefreshCw, User, Skull } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CombatState {
  id: string;
  is_active: boolean;
  round: number;
  current_turn_id: string | null;
}

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  type: 'character' | 'npc' | 'custom';
  hp_current: number;
  hp_max: number;
  is_dead: boolean;
  is_hidden: boolean;
  character_id?: string;
  npc_id?: string;
}

export const CombatTracker = ({ tableId }: { tableId: string }) => {
  const { isMaster } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Estado local para garantir resposta instantânea
  const [localCombatants, setLocalCombatants] = useState<Combatant[]>([]);

  // --- 1. Queries e Realtime ---
  const { data: serverCombatants } = useQuery({
    queryKey: ['combatants', tableId],
    queryFn: async () => {
      if (!combatState?.id) return [];
      const { data } = await supabase.from("combatants").select("*").eq("combat_id", combatState.id).order("initiative", { ascending: false });
      return data as Combatant[];
    },
    enabled: !!combatState?.id
  });

  // CORREÇÃO: Sincronização segura para evitar Loop Infinito
  useEffect(() => {
      if (serverCombatants && serverCombatants.length > 0) {
          setLocalCombatants(prev => {
              // Compara se o conteúdo mudou realmente antes de atualizar (Deep Check simples)
              if (JSON.stringify(prev) !== JSON.stringify(serverCombatants)) {
                  return serverCombatants;
              }
              return prev; // Retorna o mesmo estado para não renderizar
          });
      }
  }, [serverCombatants]);

  // Inicializar Estado do Combate
  useEffect(() => {
    const fetchState = async () => {
      const { data } = await supabase.from("combat_states").select("*").eq("table_id", tableId).maybeSingle();
      if (data) setCombatState(data as CombatState);
      else if (isMaster) {
        const { data: newState } = await supabase.from("combat_states").insert({ table_id: tableId }).select().single();
        if (newState) setCombatState(newState as CombatState);
      }
    };
    fetchState();

    const channel = supabase.channel(`combat:${tableId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_states', filter: `table_id=eq.${tableId}` }, 
        (payload) => {
           if(payload.eventType === 'DELETE') setCombatState(null);
           else setCombatState(payload.new as CombatState);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combatants' }, 
        () => queryClient.invalidateQueries({ queryKey: ['combatants', tableId] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId, isMaster, queryClient]);

  // --- 2. Ações do Mestre (Com Otimismo) ---

  const handleStartCombat = async () => {
    setCombatState(prev => prev ? { ...prev, is_active: true, round: 1 } : null);
    await supabase.from("combat_states").update({ is_active: true, round: 1 }).eq("id", combatState?.id);
    toast({ title: "Combate Iniciado!" });
  };

  const handleStopCombat = async () => {
    setCombatState(prev => prev ? { ...prev, is_active: false } : null);
    await supabase.from("combat_states").update({ is_active: false, round: 1, current_turn_id: null }).eq("id", combatState?.id);
    toast({ title: "Combate Encerrado" });
  };

  const handleNextTurn = async () => {
    if (!localCombatants.length) return;
    
    const currentIndex = localCombatants.findIndex(c => c.id === combatState?.current_turn_id);
    let nextIndex = currentIndex + 1;
    let nextRound = combatState?.round || 1;

    if (nextIndex >= localCombatants.length) {
        nextIndex = 0;
        nextRound++;
    }

    const nextCombatant = localCombatants[nextIndex];

    setCombatState(prev => prev ? { ...prev, current_turn_id: nextCombatant.id, round: nextRound } : null);

    await supabase.from("combat_states").update({ 
        current_turn_id: nextCombatant.id,
        round: nextRound
    }).eq("id", combatState?.id);
  };

  const handleAddPCs = async () => {
    const { data: chars } = await supabase.from("characters").select("id, name, data").eq("table_id", tableId);
    if (!chars) return;

    const newCombatants = chars.map(char => ({
        // Nota: O ID é gerado pelo banco, aqui usamos apenas para envio
        combat_id: combatState!.id,
        name: char.name,
        type: 'character',
        character_id: char.id,
        initiative: Number((char.data as any)?.attributes?.quick?.value) || 10,
        hp_current: Number((char.data as any)?.toughness?.current) || 10,
        hp_max: Number((char.data as any)?.toughness?.max) || 10,
        is_dead: false,
        is_hidden: false
    }));

    // Inserção direta (o realtime vai atualizar a lista depois)
    await supabase.from("combatants").insert(newCombatants);
    toast({ title: "Personagens adicionados" });
  };

  const handleAddCustom = async () => {
      const newNpc = {
          combat_id: combatState!.id,
          name: "Inimigo",
          type: 'npc',
          initiative: 10,
          hp_current: 10,
          hp_max: 10,
          is_dead: false,
          is_hidden: false
      };
      await supabase.from("combatants").insert(newNpc);
  };

  const handleUpdateCombatant = async (id: string, updates: any) => {
      // Atualiza localmente imediatamente (UI Responsiva)
      setLocalCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      // Envia para o servidor (Debounce seria ideal aqui, mas direto funciona para agora)
      await supabase.from("combatants").update(updates).eq("id", id);
  };

  const handleDeleteCombatant = async (id: string) => {
      setLocalCombatants(prev => prev.filter(c => c.id !== id));
      await supabase.from("combatants").delete().eq("id", id);
  };

  // --- 3. Renderização ---

  if (!combatState) return null;
  if (!isMaster && !combatState.is_active) return null;

  return (
    <Card className="w-80 shadow-2xl border-border/50 bg-black/90 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 transition-all duration-300">
       
       {/* Header */}
       <div 
         className="p-3 bg-muted/20 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
         onClick={() => setIsMinimized(!isMinimized)}
       >
          <div className="flex items-center gap-2 font-bold text-white text-sm">
             <Swords className="w-4 h-4 text-red-500" /> 
             {combatState.is_active ? `Round ${combatState.round}` : "Combate"}
          </div>
          <div className="flex items-center gap-1">
             {isMaster && (
                 <Button 
                    size="sm" 
                    variant={combatState.is_active ? "destructive" : "default"} 
                    className="h-7 text-xs px-2"
                    onClick={(e) => { e.stopPropagation(); combatState.is_active ? handleStopCombat() : handleStartCombat(); }}
                 >
                    {combatState.is_active ? "Parar" : "Iniciar"}
                 </Button>
             )}
             <ChevronRight className={`w-4 h-4 text-white/50 transition-transform ${isMinimized ? "rotate-90" : "-rotate-90"}`} />
          </div>
       </div>

       {/* Lista de Combatentes */}
       {!isMinimized && (
           <div className="flex flex-col">
               {isMaster && combatState.is_active && (
                   <div className="p-2 border-b border-white/10 bg-green-900/20">
                       <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-8" onClick={handleNextTurn}>
                           Próximo Turno <ChevronRight className="w-4 h-4 ml-1" />
                       </Button>
                   </div>
               )}

               <ScrollArea className="max-h-[400px]">
                   <div className="flex flex-col">
                       {localCombatants.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem combatentes.</p>}
                       
                       {localCombatants.map(c => {
                           const isTurn = combatState.current_turn_id === c.id;
                           return (
                               <div 
                                 key={c.id} 
                                 className={cn(
                                     "flex items-center gap-2 p-2 border-b border-white/5 hover:bg-white/5 transition-colors relative",
                                     isTurn && "bg-accent/10 border-l-2 border-l-accent"
                                 )}
                               >
                                   {/* Indicador de Turno */}
                                   {isTurn && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_var(--accent)]" />}

                                   <div className="w-8 text-center shrink-0">
                                       {isMaster ? (
                                           <Input 
                                             className="h-6 w-8 p-0 text-center text-xs bg-transparent border-white/20 focus:border-accent" 
                                             value={c.initiative} 
                                             onChange={(e) => handleUpdateCombatant(c.id, { initiative: parseInt(e.target.value) || 0 })}
                                           />
                                       ) : (
                                           <span className="font-mono text-lg font-bold text-white/50">{c.initiative}</span>
                                       )}
                                   </div>

                                   <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                           <Avatar className="h-6 w-6 border border-white/10">
                                               <AvatarFallback className="text-[9px] bg-primary/20">{c.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                           </Avatar>
                                           <span className={cn("text-sm font-medium truncate", c.is_dead && "line-through text-muted-foreground")}>
                                               {c.name}
                                           </span>
                                       </div>
                                       <div className="h-1 w-full bg-white/10 mt-1 rounded-full overflow-hidden">
                                           <div 
                                             className={cn("h-full transition-all duration-300", c.hp_current < c.hp_max / 4 ? "bg-red-500" : "bg-green-500")} 
                                             style={{ width: `${Math.min(100, Math.max(0, (c.hp_current / (c.hp_max || 1)) * 100))}%` }} 
                                           />
                                       </div>
                                   </div>

                                   {isMaster && (
                                       <div className="flex gap-1 shrink-0">
                                           <Button 
                                              size="icon" variant="ghost" className={cn("h-6 w-6 hover:bg-red-900/30", c.is_dead ? "text-red-500" : "text-white/30")}
                                              onClick={() => handleUpdateCombatant(c.id, { is_dead: !c.is_dead })}
                                              title="Morto/Vivo"
                                           >
                                              <Skull className="w-3 h-3" />
                                           </Button>
                                           <Button 
                                              size="icon" variant="ghost" className="h-6 w-6 text-white/30 hover:text-destructive"
                                              onClick={() => handleDeleteCombatant(c.id)}
                                           >
                                              <Trash2 className="w-3 h-3" />
                                           </Button>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               </ScrollArea>

               {isMaster && (
                   <div className="p-2 border-t border-white/10 flex gap-1">
                       <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7" onClick={handleAddPCs}>
                           <User className="w-3 h-3 mr-1" /> Add PCs
                       </Button>
                       <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7" onClick={handleAddCustom}>
                           <Plus className="w-3 h-3 mr-1" /> Add NPC
                       </Button>
                       <Button size="icon" variant="outline" className="h-7 w-7" title="Resetar Round" onClick={() => supabase.from("combat_states").update({ round: 1 }).eq("id", combatState.id)}>
                           <RefreshCw className="w-3 h-3" />
                       </Button>
                   </div>
               )}
           </div>
       )}
    </Card>
  );
};