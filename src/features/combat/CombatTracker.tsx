// src/features/combat/CombatTracker.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Swords, ChevronRight, Plus, Trash2, RefreshCw, User, Skull, 
  Heart, Eye, EyeOff, ShieldAlert 
} from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

// Componente auxiliar para Input de Iniciativa com "Commit on Blur"
const InitiativeInput = ({ value, onCommit, disabled }: { value: number, onCommit: (val: number) => void, disabled: boolean }) => {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    const handleBlur = () => {
        const num = parseInt(localValue) || 0;
        if (num !== value) onCommit(num);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // Força o onBlur
        }
    };

    if (disabled) return <span className="font-mono text-lg font-bold text-white/50">{value}</span>;

    return (
        <Input 
            className="h-6 w-8 p-0 text-center text-xs bg-transparent border-white/20 focus:border-accent text-white" 
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
};

export const CombatTracker = ({ tableId }: { tableId: string }) => {
  const { isMaster } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Estado local para resposta instantânea
  const [localCombatants, setLocalCombatants] = useState<Combatant[]>([]);

  // --- QUERIES ---
  const { data: serverCombatants = [] } = useQuery({
    queryKey: ['combatants', tableId],
    queryFn: async () => {
      if (!combatState?.id) return [];
      const { data } = await supabase
        .from("combatants")
        .select("*")
        .eq("combat_id", combatState.id)
        .order("initiative", { ascending: false }); // Ordem correta
      return data as Combatant[];
    },
    enabled: !!combatState?.id
  });

  useEffect(() => {
      if (serverCombatants) {
          // Manter a ordem de iniciativa visualmente
          const sorted = [...serverCombatants].sort((a, b) => b.initiative - a.initiative);
          setLocalCombatants(sorted);
      }
  }, [serverCombatants]);

  // Inicializar Estado
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

  // --- AÇÕES ---

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
    
    // Encontrar índice atual
    let currentIndex = localCombatants.findIndex(c => c.id === combatState?.current_turn_id);
    if (currentIndex === -1) currentIndex = -1;

    let nextIndex = currentIndex;
    let loops = 0;
    let nextRound = combatState?.round || 1;
    let found = false;

    // Loop para encontrar o próximo VIVO
    while (loops < localCombatants.length + 1) {
        nextIndex++;
        
        // Se chegar ao fim da lista, volta ao início e incrementa o round
        if (nextIndex >= localCombatants.length) {
            nextIndex = 0;
            // Só incrementa round se já tínhamos começado o combate (índice não era -1)
            if (currentIndex !== -1) nextRound++;
        }

        // Verifica se está vivo (ou se ignoramos estado de morte)
        if (!localCombatants[nextIndex].is_dead) {
            found = true;
            break;
        }
        loops++;
    }

    if (!found) {
        toast({ title: "Todos estão mortos?", variant: "destructive" });
        return;
    }

    const nextCombatant = localCombatants[nextIndex];

    // Atualização otimista
    setCombatState(prev => prev ? { ...prev, current_turn_id: nextCombatant.id, round: nextRound } : null);

    await supabase.from("combat_states").update({ 
        current_turn_id: nextCombatant.id,
        round: nextRound
    }).eq("id", combatState?.id);
  };

  const handleUpdateCombatant = async (id: string, updates: Partial<Combatant>) => {
      // Otimista
      setLocalCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      // DB
      await supabase.from("combatants").update(updates).eq("id", id);
  };

  const handleAdjustHP = async (id: string, amount: number, current: number, max: number) => {
      const newHp = Math.min(max, Math.max(0, current + amount));
      // Verifica se morreu automaticamente (opcional, aqui apenas sugerimos visualmente)
      const isNowDead = newHp === 0;
      
      handleUpdateCombatant(id, { hp_current: newHp, is_dead: isNowDead ? true : undefined });
      
      toast({ 
          title: amount < 0 ? `Dano: ${amount}` : `Cura: +${amount}`,
          description: isNowDead ? "O combatente caiu!" : `HP: ${newHp}/${max}`,
          variant: amount < 0 ? "destructive" : "default"
      });
  };

  const handleAddCombatant = async (type: 'character' | 'npc') => {
     if (type === 'character') {
         // Adiciona todos os PCs da mesa
         const { data: chars } = await supabase.from("characters").select("id, name, data").eq("table_id", tableId);
         if (!chars) return;
         
         const newCombatants = chars.map(char => {
            const attrs = (char.data as any)?.attributes || {};
            const tough = (char.data as any)?.toughness || {};
            return {
                combat_id: combatState!.id,
                name: char.name,
                type: 'character',
                character_id: char.id,
                initiative: Number(attrs.quick?.value) || 10,
                hp_current: Number(tough.current) || 10,
                hp_max: (Number(attrs.vigorous?.value) || 10) + (Number(tough.bonus) || 0),
                is_dead: false,
                is_hidden: false
            };
         });
         
         if (newCombatants.length) await supabase.from("combatants").insert(newCombatants);
         toast({ title: "Personagens adicionados" });

     } else {
         // Adiciona um NPC genérico
         await supabase.from("combatants").insert({
             combat_id: combatState!.id,
             name: "Inimigo",
             type: 'npc',
             initiative: 10,
             hp_current: 10,
             hp_max: 10,
             is_dead: false,
             is_hidden: true // NPCs começam escondidos por segurança
         });
     }
  };

  const handleDelete = async (id: string) => {
      setLocalCombatants(prev => prev.filter(c => c.id !== id));
      await supabase.from("combatants").delete().eq("id", id);
  };

  // --- RENDER ---
  if (!combatState) return null;
  if (!isMaster && !combatState.is_active) return null;

  return (
    <Card className="w-80 shadow-2xl border-border/50 bg-black/90 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 transition-all duration-300">
       {/* HEADER */}
       <div 
         className="p-3 bg-muted/20 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5"
         onClick={() => setIsMinimized(!isMinimized)}
       >
          <div className="flex items-center gap-2 font-bold text-white text-sm">
             <Swords className={cn("w-4 h-4", combatState.is_active ? "text-red-500 animate-pulse" : "text-muted-foreground")} /> 
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
             <ChevronRight className={cn("w-4 h-4 text-white/50 transition-transform", isMinimized ? "rotate-90" : "-rotate-90")} />
          </div>
       </div>

       {/* CONTEÚDO */}
       {!isMinimized && (
           <div className="flex flex-col">
               {isMaster && combatState.is_active && (
                   <div className="p-2 border-b border-white/10 bg-green-900/20">
                       <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-8 font-bold shadow-md" onClick={handleNextTurn}>
                           Próximo Turno <ChevronRight className="w-4 h-4 ml-1" />
                       </Button>
                   </div>
               )}

               <ScrollArea className="max-h-[50vh]">
                   <div className="flex flex-col">
                       {localCombatants.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 italic">Mesa pacífica...</p>}
                       
                       {localCombatants.map(c => {
                           const isTurn = combatState.current_turn_id === c.id;
                           if (!isMaster && c.is_hidden) return null; // Esconde do jogador

                           return (
                               <div 
                                 key={c.id} 
                                 className={cn(
                                     "flex items-center gap-2 p-2 border-b border-white/5 transition-colors relative group",
                                     isTurn ? "bg-accent/10" : "hover:bg-white/5",
                                     c.is_dead && "opacity-50 grayscale"
                                 )}
                               >
                                   {/* Indicador de Turno */}
                                   {isTurn && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_var(--accent)]" />}

                                   {/* Iniciativa */}
                                   <div className="w-8 text-center shrink-0">
                                       <InitiativeInput 
                                          value={c.initiative} 
                                          onCommit={(val) => handleUpdateCombatant(c.id, { initiative: val })}
                                          disabled={!isMaster}
                                       />
                                   </div>

                                   {/* Nome e Vida */}
                                   <div className="flex-1 min-w-0 flex flex-col gap-1">
                                       <div className="flex items-center gap-2">
                                           <Avatar className="h-5 w-5 border border-white/10">
                                               <AvatarFallback className="text-[8px] bg-primary/20 text-white">
                                                  {c.name.substring(0,2).toUpperCase()}
                                               </AvatarFallback>
                                           </Avatar>
                                           
                                           {isMaster ? (
                                               <Input 
                                                  className="h-6 bg-transparent border-none text-sm font-medium text-white p-0 focus-visible:ring-0" 
                                                  value={c.name}
                                                  onChange={(e) => handleUpdateCombatant(c.id, { name: e.target.value })}
                                               />
                                           ) : (
                                               <span className={cn("text-sm font-medium truncate", c.is_dead && "line-through")}>{c.name}</span>
                                           )}
                                       </div>
                                       
                                       {/* Barra de HP Interativa */}
                                       <Popover>
                                           <PopoverTrigger asChild disabled={!isMaster}>
                                               <div className={cn("h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/30 transition-all")}>
                                                   <div 
                                                     className={cn("h-full transition-all duration-500", c.hp_current < c.hp_max / 4 ? "bg-red-500" : "bg-green-500")} 
                                                     style={{ width: `${Math.min(100, Math.max(0, (c.hp_current / (c.hp_max || 1)) * 100))}%` }} 
                                                   />
                                               </div>
                                           </PopoverTrigger>
                                           <PopoverContent className="w-48 p-2 bg-black/90 border-white/20 backdrop-blur-xl" side="bottom">
                                               <div className="flex items-center justify-between text-xs text-white mb-2">
                                                   <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/> {c.hp_current} / {c.hp_max}</span>
                                                   <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleUpdateCombatant(c.id, { hp_current: c.hp_max })}>
                                                       <RefreshCw className="w-3 h-3" />
                                                   </Button>
                                               </div>
                                               <div className="grid grid-cols-4 gap-1">
                                                   <Button size="sm" variant="destructive" className="h-7 text-xs px-0" onClick={() => handleAdjustHP(c.id, -5, c.hp_current, c.hp_max)}>-5</Button>
                                                   <Button size="sm" variant="destructive" className="h-7 text-xs px-0" onClick={() => handleAdjustHP(c.id, -1, c.hp_current, c.hp_max)}>-1</Button>
                                                   <Button size="sm" className="h-7 text-xs px-0 bg-green-600 hover:bg-green-700" onClick={() => handleAdjustHP(c.id, 1, c.hp_current, c.hp_max)}>+1</Button>
                                                   <Button size="sm" className="h-7 text-xs px-0 bg-green-600 hover:bg-green-700" onClick={() => handleAdjustHP(c.id, 5, c.hp_current, c.hp_max)}>+5</Button>
                                               </div>
                                           </PopoverContent>
                                       </Popover>
                                   </div>

                                   {/* Ações do Mestre */}
                                   {isMaster && (
                                       <div className="flex gap-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                           <Button 
                                              size="icon" variant="ghost" className="h-6 w-6 hover:text-white"
                                              onClick={() => handleUpdateCombatant(c.id, { is_hidden: !c.is_hidden })}
                                              title={c.is_hidden ? "Revelar" : "Esconder"}
                                           >
                                              {c.is_hidden ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-blue-400" />}
                                           </Button>
                                           <Button 
                                              size="icon" variant="ghost" className={cn("h-6 w-6", c.is_dead ? "text-red-500" : "hover:text-red-500")}
                                              onClick={() => handleUpdateCombatant(c.id, { is_dead: !c.is_dead })}
                                              title="Morto/Vivo"
                                           >
                                              <Skull className="w-3 h-3" />
                                           </Button>
                                           <Button 
                                              size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive"
                                              onClick={() => handleDelete(c.id)}
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
                       <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7 bg-white/5 hover:bg-white/10" onClick={() => handleAddCombatant('character')}>
                           <User className="w-3 h-3 mr-1" /> Add PCs
                       </Button>
                       <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7 bg-white/5 hover:bg-white/10" onClick={() => handleAddCombatant('npc')}>
                           <Plus className="w-3 h-3 mr-1" /> Add NPC
                       </Button>
                       <Button size="icon" variant="outline" className="h-7 w-7 border-white/10 hover:bg-white/10" title="Resetar Round" onClick={() => supabase.from("combat_states").update({ round: 1 }).eq("id", combatState.id)}>
                           <RefreshCw className="w-3 h-3" />
                       </Button>
                   </div>
               )}
           </div>
       )}
    </Card>
  );
};