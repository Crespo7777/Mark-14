import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ShieldCheck } from "lucide-react";
import { FormControl, FormField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { NpcVitalityCard } from "@/features/systems/symbaroum/combat/components/NpcVitalityCard";
import { NpcCorruptionCard } from "@/features/systems/symbaroum/combat/components/NpcCorruptionCard";
import { useSymbaroumNpcSheet } from "../../SymbaroumNpcSheetContext";

interface NpcCombatStatsProps {
  toughnessMax: number;
  damageReduction: number;
  painThreshold: number;
  onDamage: (val: number) => void;
  onHeal: (val: number) => void;
}

export const NpcCombatStats = ({ 
  toughnessMax, 
  damageReduction, 
  painThreshold,
  onDamage, 
  onHeal,
}: NpcCombatStatsProps) => {
  const { form } = useSymbaroumNpcSheet();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. DEFESA & REDUÇÃO DE DANO - Cor atualizada para Ciano Vibrante para maior nitidez */}
        <Card className="border-t-4 border-t-cyan-500 shadow-md bg-gradient-to-br from-card to-cyan-500/10 relative overflow-hidden flex flex-col h-full group transition-all hover:border-t-cyan-400">
            <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 pb-2 text-center relative flex-1 flex flex-col justify-center min-h-[120px]">
                    {/* Label Superior - Cor mais nítida */}
                    <div className="flex items-center justify-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs uppercase font-black tracking-widest mb-1 drop-shadow-sm">
                        <Shield className="w-4 h-4 fill-cyan-500/10" /> Defesa
                    </div>

                    <FormField control={form.control} name="combat.defense" render={({ field }) => (
                        <FormControl>
                            <div className="relative inline-block w-full">
                                <Input 
                                    type="number" 
                                    {...field} 
                                    className="text-7xl font-black text-center h-20 w-full border-none bg-transparent focus-visible:ring-0 p-0 shadow-none text-foreground tracking-tighter z-10 relative drop-shadow-md"
                                    onChange={e => field.onChange(e.target.value)}
                                />
                                {/* Marca d'água de fundo - Opacidade ajustada para não poluir */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500/10 font-black select-none z-0 pointer-events-none transition-transform group-hover:scale-110 duration-500">
                                    <Shield className="w-32 h-32 opacity-20" />
                                </div>
                            </div>
                        </FormControl>
                    )}/>
                </div>

                <div className="px-6"><Separator className="bg-cyan-500/30" /></div>

                {/* Rodapé de Redução - Contraste Reforçado */}
                <div className="p-4 bg-cyan-950/20 dark:bg-cyan-500/10 mt-auto border-t border-cyan-500/10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg shadow-inner">
                                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-cyan-800 dark:text-cyan-100 uppercase tracking-wider leading-none">Redução</span>
                                <span className="text-[10px] text-cyan-600/80 dark:text-cyan-400/80 font-medium">Armadura Ativa</span>
                            </div>
                        </div>
                        {/* Valor de Redução - Tamanho e Brilho aumentados */}
                        <span className="text-4xl font-black text-cyan-700 dark:text-cyan-300 tabular-nums drop-shadow-sm">
                            {damageReduction}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 2. VITALIDADE NPC */}
        <NpcVitalityCard 
            form={form} 
            control={form.control}
            max={toughnessMax}
            painThreshold={painThreshold}
            onDamage={onDamage}
            onHeal={onHeal}
        />

        {/* 3. CORRUPÇÃO NPC */}
        <NpcCorruptionCard form={form} />
    </div>
  );
};