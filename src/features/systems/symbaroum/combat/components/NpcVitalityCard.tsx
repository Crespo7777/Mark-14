import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Skull, Plus, AlertOctagon } from "lucide-react";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Componente Compacto de Ação (igual ao do Jogador)
const QuickAction = ({ label, onApply, icon: Icon, variant, className }: any) => {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2 w-full h-8">
        <Input 
            type="number" 
            placeholder="#" 
            className="w-12 h-full text-center px-1 text-xs font-bold bg-background shrink-0" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
        />
        <Button 
            size="sm" 
            type="button" 
            variant={variant || "outline"}
            className={cn("flex-1 h-full text-xs font-bold uppercase tracking-wide", className)}
            onClick={() => { 
                const num = parseInt(val);
                if (!isNaN(num) && num > 0) {
                    onApply(num); 
                    setVal(""); 
                }
            }}
            disabled={!val || parseInt(val) <= 0}
        >
            {Icon && <Icon className="w-3 h-3 mr-2" />} {label}
        </Button>
    </div>
  );
};

interface NpcVitalityCardProps {
  form: UseFormReturn<any>;
  // Agora são opcionais: se não vierem, usamos a lógica interna
  onDamage?: (val: number) => void;
  onHeal?: (val: number) => void;
}

export const NpcVitalityCard = ({ form, onDamage: externalOnDamage, onHeal: externalOnHeal }: NpcVitalityCardProps) => {
  const { toast } = useToast();

  // Watch dos valores para atualizar a barra e cálculos em tempo real
  const current = Number(form.watch("toughness.current")) || 0;
  const temp = Number(form.watch("toughness.temporary")) || 0;
  const maxBase = Number(form.watch("toughness.max")) || 10;
  const maxMod = Number(form.watch("toughness.max_modifier")) || 0;
  
  const totalMax = maxBase + maxMod;
  
  // Cálculo da porcentagem para a barra visual
  const percent = Math.min(100, Math.max(0, (current / (totalMax || 1)) * 100));
  
  // Cor dinâmica da barra
  let statusColor = "bg-green-600";
  if (percent < 25) statusColor = "bg-red-600 animate-pulse";
  else if (percent < 50) statusColor = "bg-yellow-500";

  // --- LÓGICA DE DANO (Corrige o botão não funcionar) ---
  const handleApplyDamage = (amount: number) => {
      // 1. Se o pai passou uma função customizada, usa ela
      if (externalOnDamage) {
          externalOnDamage(amount);
          return;
      }

      // 2. Senão, executa a lógica padrão aqui mesmo
      let damageRemaining = amount;
      let newTemp = temp;
      
      // Absorve dano na vida temporária primeiro
      if (newTemp > 0) {
          if (newTemp >= damageRemaining) {
              newTemp -= damageRemaining;
              damageRemaining = 0;
          } else {
              damageRemaining -= newTemp;
              newTemp = 0;
          }
      }

      // Aplica o restante na vida atual
      const newCurrent = Math.max(0, current - damageRemaining);

      // Atualiza o formulário (React Hook Form)
      form.setValue("toughness.temporary", newTemp, { shouldDirty: true, shouldTouch: true });
      form.setValue("toughness.current", newCurrent, { shouldDirty: true, shouldTouch: true });

      toast({ 
          title: "Dano Aplicado (NPC)", 
          description: `-${amount} HP. (Temp: ${newTemp}, Atual: ${newCurrent})`,
          variant: "destructive"
      });
  };

  // --- LÓGICA DE CURA (Corrige o botão não funcionar) ---
  const handleApplyHeal = (amount: number) => {
      if (externalOnHeal) {
          externalOnHeal(amount);
          return;
      }

      const newCurrent = Math.min(totalMax, current + amount);
      form.setValue("toughness.current", newCurrent, { shouldDirty: true, shouldTouch: true });

      toast({ 
          title: "Cura Aplicada (NPC)", 
          description: `+${amount} HP. (Atual: ${newCurrent}/${totalMax})`,
          variant: "default"
      });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-t-4 border-t-red-500 shadow-sm bg-gradient-to-b from-card to-red-500/5">
      <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
        <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-red-600 font-bold text-base">
                <Heart className="w-4 h-4 fill-current" /> Vitalidade
            </span>
            
            {/* Input de Limiar de Dor */}
            <div className="flex items-center gap-2 bg-background border rounded px-2 py-1 shadow-sm">
                <AlertOctagon className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-muted-foreground font-semibold">Dor:</span>
                <FormField control={form.control} name="combat.pain_threshold" render={({ field }) => (
                    <Input 
                        {...field} 
                        // Blinda contra erro de uncontrolled input
                        value={field.value ?? 0}
                        type="number" 
                        className="h-5 w-10 p-0 text-center border-none bg-transparent font-bold text-sm focus-visible:ring-0" 
                        placeholder="5"
                        onChange={e => field.onChange(Number(e.target.value))}
                    />
                )}/>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 flex-1 flex flex-col">
        
        {/* BARRA DE VIDA VISUAL */}
        <div className="relative h-10 w-full bg-secondary/50 rounded-lg overflow-hidden border border-border/50 shadow-inner">
            <div 
                className={cn("h-full transition-all duration-500 ease-out", statusColor)} 
                style={{ width: `${percent}%` }} 
            />
            <div className="absolute inset-0 flex items-center justify-center font-black text-lg drop-shadow-md text-white mix-blend-difference z-10">
                {current} / {totalMax} {temp > 0 && <span className="ml-1 text-blue-300">(+{temp})</span>}
            </div>
        </div>

        {/* INPUTS DE AJUSTE (TEMP E MODIFICADOR DE MÁXIMO) */}
        <div className="grid grid-cols-2 gap-2">
            
            {/* Modificador de Máximo */}
            <FormField control={form.control} name="toughness.max_modifier" render={({ field }) => (
                <FormItem className="space-y-0">
                     <div className="flex items-center gap-2 border rounded px-2 h-8 bg-background shadow-sm">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground whitespace-nowrap">Máx+</span>
                        <FormControl>
                            <Input 
                                {...field}
                                value={field.value ?? 0}
                                type="number" 
                                className="h-6 border-none text-right p-0 focus-visible:ring-0 font-mono" 
                                placeholder="0" 
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                     </div>
                </FormItem>
            )}/>
            
            {/* Vida Temporária */}
            <FormField control={form.control} name="toughness.temporary" render={({ field }) => (
                <FormItem className="space-y-0">
                    <div className="flex items-center gap-2 border rounded px-2 h-8 bg-background shadow-sm border-blue-200 dark:border-blue-900/50">
                        <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Temp</span>
                        <FormControl>
                            <Input 
                                {...field}
                                value={field.value ?? 0}
                                type="number" 
                                className="h-6 border-none text-right p-0 focus-visible:ring-0 text-blue-600 font-bold" 
                                placeholder="0" 
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                    </div>
                </FormItem>
            )}/>
        </div>

        {/* AÇÕES RÁPIDAS (BOTÕES) */}
        <div className="mt-auto pt-3 border-t border-dashed border-border/50 flex flex-col gap-2">
            <QuickAction 
                label="Aplicar Dano" 
                icon={Skull} 
                onApply={handleApplyDamage} // Usa a função interna corrigida
                variant="destructive"
                className="opacity-90 hover:opacity-100"
            />
            <QuickAction 
                label="Curar" 
                icon={Plus} 
                onApply={handleApplyHeal} // Usa a função interna corrigida
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-800"
            />
        </div>
      </CardContent>
    </Card>
  );
};