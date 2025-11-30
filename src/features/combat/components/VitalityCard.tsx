import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heart } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

const DamageHealControl = ({ label, onApply }: { label: string; onApply: (amount: number) => void; }) => {
  const [amount, setAmount] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input type="number" className="w-16 h-9 text-center" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Button type="button" size="sm" variant="outline" onClick={() => { onApply(parseInt(amount) || 0); setAmount(""); }}>{label}</Button>
    </div>
  );
};

interface VitalityCardProps {
  form: UseFormReturn<any>;
  currentField: string;
  max: number;
  painThreshold: number;
  onDamage: (val: number) => void;
  onHeal: (val: number) => void;
  bonusField?: string;
  painBonusField?: string;
  armorRDField?: string;
  isReadOnly?: boolean;
}

export const VitalityCard = ({ 
  form, currentField, max, painThreshold, onDamage, onHeal, bonusField, painBonusField, armorRDField, isReadOnly 
}: VitalityCardProps) => {
  const current = Number(form.watch(currentField)) || 0;
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (current / safeMax) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Heart className="text-red-500" /> Vitalidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField control={form.control} name={currentField} render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex justify-between items-baseline">
                <FormLabel>Atual</FormLabel>
                <span className="text-sm text-muted-foreground">Máx: {max}</span>
              </div>
              <FormControl><Input type="number" className="text-2xl font-bold h-12" {...field} onChange={(e) => field.onChange(e.target.value)} readOnly={isReadOnly} /></FormControl>
              <Progress value={percent} className="h-2" />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2 pt-2">
            <DamageHealControl label="Dano" onApply={onDamage} />
            <DamageHealControl label="Cura" onApply={onHeal} />
        </div>

        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
           {bonusField && (
             <div>
                <span className="text-muted-foreground block">Bônus Vitalidade</span>
                <FormField control={form.control} name={bonusField} render={({ field }) => (<Input type="number" className="h-8" {...field} onChange={e => field.onChange(e.target.value)} />)}/>
             </div>
           )}
           {armorRDField && (
             <div>
                <span className="text-muted-foreground block">Armadura (RD)</span>
                <FormField control={form.control} name={armorRDField} render={({ field }) => (<Input type="number" className="h-8" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly} />)}/>
             </div>
           )}
           
           <div>
               <span className="text-muted-foreground block">Limiar de Dor: <strong className="text-foreground">{painThreshold}</strong></span>
               {painBonusField && (
                 <FormField control={form.control} name={painBonusField} render={({ field }) => (<Input type="number" className="h-8 mt-1" placeholder="Bônus" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly} />)}/>
               )}
           </div>
        </div>
      </CardContent>
    </Card>
  );
};