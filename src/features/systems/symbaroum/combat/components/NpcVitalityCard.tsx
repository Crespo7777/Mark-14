import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Skull, Plus, ShieldAlert, Activity } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Caminho corrigido para o hook de cálculos
import { useNpcCalculations } from "../../npc/hooks/useNpcCalculations"; 

const QuickActionButton = ({ onApply, icon: Icon, colorClass, tooltip }: any) => {
  const [val, setVal] = useState("");
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="flex h-10 w-full items-stretch rounded-lg border border-border/40 bg-black/40 overflow-hidden shadow-inner focus-within:ring-1 focus-within:ring-primary/40 transition-all">
        <input 
          type="number" 
          placeholder="0" 
          className="w-1/2 bg-transparent text-center font-mono text-sm font-bold focus:outline-none border-none p-0 appearance-none text-foreground placeholder:opacity-20" 
          value={val} 
          onChange={e => setVal(e.target.value)} 
        />
        <Button 
          size="sm" 
          type="button" 
          variant="ghost"
          className={cn("flex-1 h-full rounded-none border-l border-border/30 px-0 flex items-center justify-center transition-colors", colorClass)}
          onClick={() => { 
            const num = parseInt(val);
            if (!isNaN(num) && num > 0) {
              onApply(num); 
              setVal(""); 
            }
          }}
          disabled={!val || parseInt(val) <= 0}
          title={tooltip}
        >
          <Icon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export const NpcVitalityCard = ({ form, onDamage: extDamage, onHeal: extHeal }: { form: UseFormReturn<any>, onDamage?: any, onHeal?: any }) => {
  const { toast } = useToast();
  const { damageReduction } = useNpcCalculations();

  const current = Number(useWatch({ control: form.control, name: "combat.toughness_current" })) || 0;
  const totalMax = Number(useWatch({ control: form.control, name: "combat.toughness_max" })) || 10;
  const painThreshold = Number(useWatch({ control: form.control, name: "combat.pain_threshold" })) || 5;

  useEffect(() => {
    if (form.getValues("combat.toughness_temp") !== 0 || form.getValues("combat.toughness_max_modifier") !== 0) {
      form.setValue("combat.toughness_temp", 0);
      form.setValue("combat.toughness_max_modifier", 0);
    }
  }, [form]);

  useEffect(() => {
    if (current > totalMax) form.setValue("combat.toughness_current", totalMax, { shouldDirty: true });
  }, [totalMax, current, form]);

  const handleApplyDamage = (amount: number) => {
    if (extDamage) { extDamage(amount); return; }
    
    // REDUÇÃO AUTOMÁTICA (Invisível visualmente, mas ativa na matemática)
    const finalDamage = Math.max(0, amount - damageReduction);
    const newCurrent = Math.max(0, current - finalDamage);
    
    form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true });
    
    toast({
      title: finalDamage === 0 ? "Ataque Bloqueado" : "Dano Aplicado",
      description: `Original: ${amount} | Redução: ${damageReduction} | Final: ${finalDamage}`,
      variant: finalDamage === 0 ? "default" : "destructive"
    });
  };

  const percent = Math.min(100, Math.max(0, (current / (totalMax || 1)) * 100));
  const isWounded = current <= painThreshold && current > 0;
  const isDead = current <= 0;

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl overflow-hidden rounded-xl font-sans">
      <div className={cn("h-1.5 w-full transition-all duration-500", isDead ? "bg-slate-900" : isWounded ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]")} />

      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 opacity-70">
            <Activity className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vitalidade</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            <input 
                type="number" 
                className="w-6 bg-transparent border-none text-[10px] font-mono font-black text-center focus:outline-none" 
                {...form.register("combat.pain_threshold", { valueAsNumber: true })} 
                title="Limiar de Dor"
            />
          </div>
        </div>

        <div className="relative h-20 w-full rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          <div className={cn("absolute left-0 top-0 h-full transition-all duration-1000 ease-out opacity-25", isDead ? "bg-slate-950" : isWounded ? "bg-amber-700" : "bg-red-700")} style={{ width: `${percent}%` }} />
          <div className="z-10 flex flex-col items-center leading-none">
            <span className="text-4xl font-black font-mono tracking-tighter drop-shadow-md">{current}</span>
            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-1">/ {totalMax}</span>
          </div>
        </div>

        <div className="space-y-4">
          <FormField control={form.control} name="combat.toughness_max" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 ml-1">
                <Heart className="w-2.5 h-2.5 text-red-500" /> HP Máximo
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  className="h-9 font-mono font-bold text-center text-sm bg-black/20 border-border/40 focus:ring-1 focus:ring-red-500/30" 
                  {...field} 
                  onChange={e => field.onChange(e.target.value === "" ? "" : e.target.value)} 
                  onBlur={e => { 
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 10) field.onChange(10); 
                  }} 
                />
              </FormControl>
            </FormItem>
          )} />
          <div className="flex gap-3">
            <QuickActionButton 
                icon={Skull} 
                colorClass="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" 
                onApply={handleApplyDamage} 
                tooltip="Aplicar Dano (Redução Automática)"
            />
            <QuickActionButton 
                icon={Plus} 
                colorClass="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" 
                onApply={(v: number) => form.setValue("combat.toughness_current", Math.min(totalMax, current + v), { shouldDirty: true })} 
                tooltip="Aplicar Cura"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};