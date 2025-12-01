import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Activity, Skull, Plus } from "lucide-react";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

// Componente Compacto e Simples
const QuickAction = ({ label, onApply, icon: Icon, variant, className }: any) => {
  const [val, setVal] = useState("");
  
  return (
    <div className="flex items-center gap-2 w-full h-8">
        <Input 
            type="number" 
            placeholder="Qtd" 
            className="w-20 h-full text-center px-1 text-xs font-bold" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
        />
        <Button 
            size="sm" 
            variant={variant || "outline"}
            className={cn("flex-1 h-full text-xs font-bold uppercase tracking-wide", className)}
            onClick={() => { onApply(Number(val)); setVal(""); }}
            disabled={!val}
        >
            {Icon && <Icon className="w-3 h-3 mr-2" />} 
            {label}
        </Button>
    </div>
  );
};

interface VitalityCardProps {
  form: UseFormReturn<any>;
  currentField?: string;
  tempField?: string;      // Novo: Campo flexível para Temp
  maxBonusField?: string;  // Novo: Campo flexível para Bonus Max
  max: number;
  painThreshold: number;
  onDamage: (val: number) => void;
  onHeal: (val: number) => void;
  isReadOnly?: boolean;
}

export const VitalityCard = ({ 
  form, 
  currentField = "toughness.current", 
  tempField = "toughness.temporary", 
  maxBonusField = "toughness.max_modifier",
  max, 
  painThreshold, 
  onDamage, 
  onHeal,
  isReadOnly 
}: VitalityCardProps) => {
  const current = Number(form.watch(currentField)) || 0;
  const temp = Number(form.watch(tempField)) || 0;
  
  // O percentual visual considera apenas a vida real vs máxima
  const percent = Math.min(100, Math.max(0, (current / max) * 100));
  
  let statusColor = "bg-green-600";
  if (percent < 25) statusColor = "bg-red-600 animate-pulse";
  else if (percent < 50) statusColor = "bg-yellow-500";

  return (
    <Card className="h-full flex flex-col overflow-hidden border-t-4 border-t-red-500 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
        <CardTitle className="flex justify-between items-center text-base">
            <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500 fill-current" /> Vitalidade</span>
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded border">
                <Activity className="w-3 h-3" />
                Limiar: <span className="font-bold text-foreground">{painThreshold}</span>
            </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 flex-1 flex flex-col">
        
        {/* PARTE 1: BARRA E VALORES */}
        <div className="space-y-3">
            {/* Barra de Vida */}
            <div className="relative h-8 w-full bg-secondary/50 rounded-md overflow-hidden border border-border/50 shadow-inner">
                <div 
                    className={cn("h-full transition-all duration-500 ease-out", statusColor)} 
                    style={{ width: `${percent}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-sm drop-shadow-md text-white mix-blend-difference z-10">
                    {current} / {max} {temp > 0 && <span className="ml-1 text-blue-300 drop-shadow-sm opacity-100">(+{temp})</span>}
                </div>
            </div>

            {/* Inputs de Edição Direta */}
            <div className="grid grid-cols-3 gap-2">
                <FormField control={form.control} name={currentField} render={({ field }) => (
                    <FormItem className="space-y-0 text-center">
                        <Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Atual</Label>
                        <FormControl><Input type="number" className="h-7 text-center font-bold bg-muted/20 text-xs" {...field} readOnly={isReadOnly}/></FormControl>
                    </FormItem>
                )}/>
                <FormField control={form.control} name={maxBonusField} render={({ field }) => (
                    <FormItem className="space-y-0 text-center">
                        <Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Bônus Máx</Label>
                        <FormControl><Input type="number" className="h-7 text-center text-green-600 dark:text-green-400 bg-muted/20 text-xs" placeholder="+0" {...field} readOnly={isReadOnly}/></FormControl>
                    </FormItem>
                )}/>
                <FormField control={form.control} name={tempField} render={({ field }) => (
                    <FormItem className="space-y-0 text-center">
                        <Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Temp</Label>
                        <FormControl><Input type="number" className="h-7 text-center text-blue-600 dark:text-blue-400 bg-muted/20 text-xs" placeholder="+0" {...field} readOnly={isReadOnly}/></FormControl>
                    </FormItem>
                )}/>
            </div>
        </div>

        {/* PARTE 2: AÇÕES RÁPIDAS (VERTICAL SIMPLES) */}
        {!isReadOnly && (
            <div className="mt-auto pt-3 border-t border-dashed border-border flex flex-col gap-2">
                <QuickAction 
                    label="Dano" 
                    icon={Skull} 
                    onApply={onDamage} 
                    variant="destructive"
                    className="opacity-90 hover:opacity-100"
                />
                <QuickAction 
                    label="Cura" 
                    icon={Plus} 
                    onApply={onHeal} 
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900/50"
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
};