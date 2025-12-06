import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ShieldCheck } from "lucide-react";
import { FormControl, FormField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { NpcVitalityCard } from "@/features/combat/components/NpcVitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { useNpcSheet } from "../../NpcSheetContext";

interface NpcCombatStatsProps {
  toughnessMax: number;
  damageReduction: number;
  corruptionThreshold: number;
  totalDefense: number;
  onDamage: (val: number) => void;
  onHeal: (val: number) => void;
  onRollDefense: () => void;
}

export const NpcCombatStats = ({ 
  toughnessMax, 
  damageReduction, 
  onDamage, 
  onHeal,
}: NpcCombatStatsProps) => {
  const { form } = useNpcSheet();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. DEFESA & ARMADURA (Manual) */}
        <Card className="border-t-4 border-t-blue-500 shadow-sm bg-gradient-to-br from-card to-blue-500/5 relative overflow-hidden flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 pb-2 text-center relative flex-1 flex flex-col justify-center min-h-[100px]">
                    <div className="flex items-center justify-center gap-2 text-blue-600/80 text-xs uppercase font-bold tracking-widest mb-1">
                        <Shield className="w-4 h-4" /> Defesa
                    </div>
                    <FormField control={form.control} name="combat.defense" render={({ field }) => (
                        <FormControl>
                            <div className="relative inline-block w-full">
                                <Input 
                                    type="number" 
                                    {...field} 
                                    className="text-7xl font-black text-center h-20 w-full border-none bg-transparent focus-visible:ring-0 p-0 shadow-none text-foreground tracking-tighter z-10 relative"
                                    placeholder="0"
                                    onChange={e => field.onChange(e.target.value)}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-blue-500/5 font-black select-none -z-0 pointer-events-none">
                                    <Shield className="w-32 h-32 opacity-20" />
                                </div>
                            </div>
                        </FormControl>
                    )}/>
                </div>
                <div className="px-6"><Separator className="bg-blue-500/20" /></div>
                <div className="p-3 bg-blue-500/10 mt-auto">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-full">
                                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">Redução de Dano</span>
                                <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 leading-none">Automática</span>
                            </div>
                        </div>
                        <span className="text-3xl font-black text-blue-700 dark:text-blue-300 tabular-nums">
                            {damageReduction}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 2. VITALIDADE NPC (Com Control Passado) */}
        <NpcVitalityCard 
            form={form} // Mantém para compatibilidade, mas usamos o control
            control={form.control} // <--- IMPORTANTE: Passamos o control
            max={toughnessMax}
            painThreshold={0}
            onDamage={onDamage}
            onHeal={onHeal}
        />

        {/* 3. CORRUPÇÃO NPC */}
        <CorruptionCard 
            form={form} 
            threshold={0} 
            customThreshold={
                <FormField control={form.control} name="combat.corruption_threshold" render={({ field }) => ( 
                    <Input 
                        {...field} 
                        type="number" 
                        className="h-5 w-10 p-0 text-center border-none bg-transparent font-bold text-sm focus-visible:ring-0" 
                        placeholder="4"
                        onChange={e => field.onChange(e.target.value)}
                    />
                )}/>
            }
        />
    </div>
  );
};