import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Skull, Plus, AlertCircle } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const QuickAction = ({ label, onApply, icon: Icon, variant, className, inputClassName }: any) => {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2 w-full h-9">
      <Input 
        type="number" 
        placeholder="#" 
        className={cn("w-14 h-full text-center px-1 font-mono font-bold bg-background", inputClassName)} 
        value={val} 
        onChange={e => setVal(e.target.value)} 
      />
      <Button 
        size="sm" 
        type="button" 
        variant={variant || "outline"}
        className={cn("flex-1 h-full text-[10px] font-black uppercase tracking-wider gap-2", className)}
        onClick={() => { 
          const num = parseInt(val);
          if (!isNaN(num) && num > 0) {
            onApply(num); 
            setVal(""); 
          }
        }}
        disabled={!val || parseInt(val) <= 0}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </Button>
    </div>
  );
};

interface NpcVitalityCardProps {
  form: UseFormReturn<any>;
  onDamage?: (val: number) => void;
  onHeal?: (val: number) => void;
}

export const NpcVitalityCard = ({ form, onDamage: externalOnDamage, onHeal: externalOnHeal }: NpcVitalityCardProps) => {
  const { toast } = useToast();

  // "FONTE DA VERDADE" VISUAL: Estas variáveis são o que você vê na tela
  const current = Number(useWatch({ control: form.control, name: "combat.toughness_current" })) || 0;
  const temp = Number(useWatch({ control: form.control, name: "combat.toughness_temp" })) || 0;
  const maxBase = Number(useWatch({ control: form.control, name: "combat.toughness_max" })) || 10;
  const maxMod = Number(useWatch({ control: form.control, name: "combat.toughness_max_modifier" })) || 0;
  const painThreshold = Number(useWatch({ control: form.control, name: "combat.pain_threshold" })) || 5;
  
  const totalMax = maxBase + maxMod;

  // Segurança: Ajusta vida se o bônus cair
  useEffect(() => {
    if (current > totalMax) {
      form.setValue("combat.toughness_current", totalMax, { shouldDirty: true });
    }
  }, [totalMax, current, form]);

  const percent = Math.min(100, Math.max(0, (current / (totalMax || 1)) * 100));
  
  let barColor = "bg-emerald-500";
  let containerColor = "bg-emerald-500/10 border-emerald-600/20";
  
  if (current <= 0) {
    barColor = "bg-slate-900";
    containerColor = "bg-red-950/20 border-red-900/50 text-red-600";
  } else if (current <= painThreshold) {
    barColor = "bg-orange-500";
    containerColor = "bg-orange-500/10 border-orange-500/30 text-orange-600";
  }

  // --- LÓGICA DE DANO CORRIGIDA ---
  const handleApplyDamage = (amount: number) => {
    if (externalOnDamage) { externalOnDamage(amount); return; }

    // USAMOS AS VARIÁVEIS 'temp' e 'current' DO ESCOPO
    // Isso garante que se você vê "+3", o código calcula com 3.
    let damageRemaining = amount;
    let newTemp = temp;
    let newCurrent = current;

    // 1. O Escudo (Temp) absorve o dano
    if (newTemp > 0) {
      if (newTemp >= damageRemaining) {
        // Escudo absorve tudo
        newTemp -= damageRemaining;
        damageRemaining = 0;
      } else {
        // Escudo quebra, sobra dano
        damageRemaining -= newTemp;
        newTemp = 0;
      }
    }

    // 2. Aplica o dano restante na vida
    if (damageRemaining > 0) {
      newCurrent = Math.max(0, current - damageRemaining);
    }

    // 3. Atualiza o formulário
    form.setValue("combat.toughness_temp", newTemp, { shouldDirty: true, shouldTouch: true });
    form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true, shouldTouch: true });

    toast({
        title: "Dano Aplicado",
        description: `Dano: ${amount}. (Temp: ${temp} -> ${newTemp}, Vida: ${current} -> ${newCurrent})`,
        variant: "destructive"
    });
  };

  const handleApplyHeal = (amount: number) => {
    if (externalOnHeal) { externalOnHeal(amount); return; }
    
    // Cura usando a mesma lógica de variáveis do escopo
    const newCurrent = Math.min(totalMax, current + amount);
    form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true, shouldTouch: true });
    
    toast({
        title: "Cura Aplicada",
        description: `+${amount} HP (Atual: ${newCurrent}/${totalMax})`,
        className: "bg-emerald-500/10 border-emerald-500/50 text-emerald-600"
    });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-t-4 border-t-red-600 shadow-sm bg-gradient-to-br from-card to-red-500/5">
      <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
        <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider">
          <Heart className="w-4 h-4 fill-current" /> Vitalidade
        </span>
        
        <div className="flex items-center gap-2 bg-background border rounded-md px-2 py-0.5 shadow-sm border-orange-500/30">
          <AlertCircle className="w-3 h-3 text-orange-500" />
          <span className="text-[10px] text-muted-foreground font-black uppercase">Dor:</span>
          <FormField control={form.control} name="combat.pain_threshold" render={({ field }) => (
            <Input 
              {...field} 
              type="number" 
              className="h-5 w-8 p-0 text-center border-none bg-transparent font-black text-xs focus-visible:ring-0" 
              onChange={e => field.onChange(Number(e.target.value))}
            />
          )} />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-4 flex-1 flex flex-col">
        {/* VISUALIZADOR */}
        <div className={cn("relative h-14 w-full rounded-xl overflow-hidden border-2 transition-colors duration-300", containerColor)}>
          <div className={cn("h-full transition-all duration-500 ease-out opacity-20", barColor)} style={{ width: `${percent}%` }} />
          <div className="absolute inset-0 flex items-center justify-center font-black text-2xl tracking-tighter tabular-nums drop-shadow-sm">
            {current} <span className="text-sm opacity-50 mx-1">/</span> {totalMax}
            {temp > 0 && <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-bold">(+{temp})</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="combat.toughness_max_modifier" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] uppercase font-black text-muted-foreground/80">Máx+</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value ?? 0} className="h-8 text-center font-bold bg-background/50 border-border/50" onChange={e => field.onChange(Number(e.target.value))} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="combat.toughness_temp" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] uppercase font-black text-blue-600">Temp</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value ?? 0} className="h-8 text-center font-bold bg-blue-500/5 border-blue-500/20 text-blue-600" onChange={e => field.onChange(Number(e.target.value))} />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <div className="mt-auto pt-4 border-t border-dashed border-red-500/10 flex flex-col gap-2">
          <QuickAction label="Aplicar Dano" icon={Skull} onApply={handleApplyDamage} variant="destructive" className="bg-red-600 hover:bg-red-700" inputClassName="border-red-200" />
          <QuickAction label="Curar" icon={Plus} onApply={handleApplyHeal} variant="outline" className="text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30" inputClassName="border-emerald-200" />
        </div>
      </CardContent>
    </Card>
  );
};