import { Card, CardContent } from "@/components/ui/card";
import { Shield, ShieldCheck, Activity } from "lucide-react";
import { FormField } from "@/components/ui/form";
import { NpcVitalityCard } from "@/features/systems/symbaroum/combat/components/NpcVitalityCard";
import { NpcCorruptionCard } from "@/features/systems/symbaroum/combat/components/NpcCorruptionCard";
import { useSymbaroumNpcSheet } from "../../SymbaroumNpcSheetContext";
import { cn } from "@/lib/utils";

interface NpcCombatStatsProps {
  toughnessMax: number;
  damageReduction: number;
  painThreshold: number;
  onDamage: (val: number) => void;
  onHeal: (val: number) => void;
}

export const NpcCombatStats = ({ 
  damageReduction, 
  onDamage, 
  onHeal,
}: NpcCombatStatsProps) => {
  const { form } = useSymbaroumNpcSheet();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. CARD DE DEFESA & PROTEÇÃO (PADRÃO VTT) */}
        <Card className="h-full flex flex-col border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl overflow-hidden rounded-xl font-sans">
          {/* Barra de Acento Superior - Ciano */}
          <div className="h-1.5 w-full bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.4)]" />

          <CardContent className="p-4 flex flex-col gap-4 h-full">
            {/* Header de Info */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 opacity-70">
                <Shield className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Defesa</span>
              </div>
              {/* "Teste" removido conforme solicitado */}
            </div>

            {/* Display Central de Defesa (Valor Estático) */}
            <div className="relative h-20 w-full rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-50" />
              
              <div className="z-10 flex flex-col items-center leading-none w-full">
                <FormField control={form.control} name="combat.defense" render={({ field }) => (
                  <input 
                    type="number"
                    className="w-full bg-transparent border-none text-4xl font-black font-mono tracking-tighter text-center focus:outline-none drop-shadow-md text-foreground"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                )}/>
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-1">
                   Modificador
                </span>
              </div>
            </div>

            {/* Rodapé: Proteção (Redução de Dano Estática) */}
            <div className="mt-auto pt-3 border-t border-dashed border-cyan-500/20 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Proteção</span>
                </div>
                <span className="text-2xl font-black font-mono text-cyan-500 tracking-tighter">
                    {damageReduction}
                </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. VITALIDADE NPC (Já atualizado) */}
        <NpcVitalityCard 
            form={form} 
            onDamage={onDamage}
            onHeal={onHeal}
        />

        {/* 3. CORRUPÇÃO NPC (Já atualizado) */}
        <NpcCorruptionCard form={form} />
    </div>
  );
};