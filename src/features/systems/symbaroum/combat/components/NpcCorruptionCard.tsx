import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Ghost, ShieldAlert, Zap } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

interface NpcCorruptionCardProps {
  form: UseFormReturn<any>;
}

export const NpcCorruptionCard = ({ form }: NpcCorruptionCardProps) => {
  // Observando valores para a lógica visual
  const temp = Number(useWatch({ control: form.control, name: "corruption.temporary" })) || 0;
  const perm = Number(useWatch({ control: form.control, name: "corruption.permanent" })) || 0;
  const threshold = Number(useWatch({ control: form.control, name: "combat.corruption_threshold" })) || 4;

  const total = temp + perm;
  const percent = Math.min(100, Math.max(0, (total / (threshold || 1)) * 100));
  
  // Estados de cor baseados na regra de Symbaroum
  const isDanger = total >= threshold;

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl overflow-hidden rounded-xl font-sans">
      {/* Barra de Acento Superior - Roxo */}
      <div className={cn(
        "h-1.5 w-full transition-all duration-500",
        isDanger ? "bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-purple-700"
      )} />

      <CardContent className="p-4 flex flex-col gap-4">
        {/* Header de Info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 opacity-70">
            <Ghost className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Corrupção</span>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            <input 
              type="number"
              className="w-6 bg-transparent border-none text-[10px] font-mono font-black text-center focus:outline-none"
              {...form.register("combat.corruption_threshold", { valueAsNumber: true })}
              title="Limiar de Corrupção"
            />
          </div>
        </div>

        {/* Display Central de Corrupção (Estilo Glass) */}
        <div className="relative h-20 w-full rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          {/* Barra de Progresso de Corrupção */}
          <div 
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-1000 ease-out opacity-20",
              isDanger ? "bg-purple-400" : "bg-purple-600"
            )} 
            style={{ width: `${percent}%` }} 
          />
          
          <div className="z-10 flex flex-col items-center leading-none">
            <span className={cn(
              "text-4xl font-black font-mono tracking-tighter drop-shadow-md",
              isDanger ? "text-purple-300" : "text-foreground"
            )}>
              {total}
            </span>
            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-1">
               Total / {threshold}
            </span>
          </div>
        </div>

        {/* Controles de Edição */}
        <div className="grid grid-cols-2 gap-3">
          {/* Corrupção Temporária */}
          <FormField
            control={form.control}
            name="corruption.temporary"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 ml-1">
                  <Zap className="w-2.5 h-2.5 text-purple-400" /> Temporária
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-9 font-mono font-bold text-center text-sm bg-black/20 border-border/40 focus:ring-1 focus:ring-purple-500/30"
                    {...field}
                    onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Corrupção Permanente */}
          <FormField
            control={form.control}
            name="corruption.permanent"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 ml-1">
                  <ShieldAlert className="w-2.5 h-2.5 text-purple-600" /> Permanente
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-9 font-mono font-bold text-center text-sm bg-black/20 border-border/40 focus:ring-1 focus:ring-purple-500/30"
                    {...field}
                    onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};