import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Ghost, ShieldAlert, Zap, Shield } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

interface NpcCorruptionCardProps {
  form: UseFormReturn<any>;
}

export const NpcCorruptionCard = ({ form }: NpcCorruptionCardProps) => {
  const perm = Number(useWatch({ control: form.control, name: "corruption.permanent" })) || 0;
  const temp = Number(useWatch({ control: form.control, name: "corruption.temporary" })) || 0;
  const threshold = Number(useWatch({ control: form.control, name: "combat.corruption_threshold" })) || 4;

  const isDanger = perm >= threshold;

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl overflow-hidden rounded-xl font-sans">
      {/* Barra de Acento Superior */}
      <div className={cn(
        "h-1.5 w-full transition-all duration-500",
        isDanger ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-purple-700"
      )} />

      <CardContent className="p-4 flex flex-col gap-4">
        {/* Header: Título e Limiar (Design Compacto para não quebrar) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Ghost className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Corrupção</span>
          </div>

          {/* Limiar como uma "Pílula" compacta */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 shrink-0">
            <ShieldAlert className="w-3 h-3 text-purple-500/70" />
            <span className="text-[8px] font-bold text-purple-600/80 uppercase">Lim:</span>
            <input 
              type="number"
              className="w-4 bg-transparent border-none text-[10px] font-mono font-black text-center focus:outline-none text-purple-700 p-0"
              {...form.register("combat.corruption_threshold", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Display Central (Glassmorphism) */}
        <div className="relative h-20 w-full rounded-lg bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          <div className="z-10 flex flex-col items-center leading-none">
            <span className={cn(
              "text-4xl font-black font-mono tracking-tighter tabular-nums drop-shadow-md",
              isDanger ? "text-purple-300" : "text-foreground"
            )}>
              {perm}
            </span>
            <div className="flex items-center gap-1.5 mt-1 opacity-40">
              <span className="text-[8px] font-black uppercase tracking-widest">Mácula Permanente</span>
              {temp > 0 && (
                <span className="text-[9px] font-bold text-purple-400">
                  (+{temp} T)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controles Manuais */}
        <div className="grid grid-cols-2 gap-2">
          {/* Campo: Temporária */}
          <FormField
            control={form.control}
            name="corruption.temporary"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-tighter ml-1">
                  Temporária
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-8 font-mono font-bold text-center text-xs bg-black/20 border-border/40 focus:ring-1 focus:ring-purple-500/30"
                    {...field}
                    onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Campo: Permanente */}
          <FormField
            control={form.control}
            name="corruption.permanent"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-tighter ml-1">
                  Permanente
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-8 font-mono font-bold text-center text-xs bg-black/20 border-border/40 focus:ring-1 focus:ring-purple-500/30"
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