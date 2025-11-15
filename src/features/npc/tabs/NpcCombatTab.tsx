// src/features/npc/tabs/NpcCombatTab.tsx

import { useState, useEffect } from "react"; 
import { useNpcSheet } from "../NpcSheetContext"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heart, Shield, ShieldAlert } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast"; 
import { roundUpDiv } from "@/features/character/character.schema";
// import { cn } from "@/lib/utils"; // <-- Não é necessário

/**
 * Componente de UI reutilizável para aplicar dano/cura
 */
const DamageHealControl = ({
  label,
  onApply,
  buttonLabel = "Aplicar",
}: {
  label: string;
  onApply: (amount: number) => void;
  buttonLabel?: string;
}) => {
  const [amount, setAmount] = useState(1);
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-16 h-9 text-center"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
        aria-label={label}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onApply(amount)}
      >
        {buttonLabel}
      </Button>
    </div>
  );
};

export const NpcCombatTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet(); 
  const { toast } = useToast(); 

  const currentToughness = form.watch("combat.toughness_current");
  const maxToughness = form.watch("combat.toughness_max"); 

  const [displayDefense, setDisplayDefense] = useState<string>(() => {
    const val = form.getValues("combat.defense");
    return val === 0 || isNaN(val) ? "" : String(val);
  });
  
  const watchedDefense = form.watch("combat.defense");
  const vigorous = form.watch("attributes.vigorous.value");
  const painThresholdBonus = form.watch("combat.pain_threshold_bonus");


  // Observa o Vigoroso E O BÓNUS
  useEffect(() => {
    if (!isReadOnly) { 
      const newMaxToughness = Math.max(10, vigorous || 0);
      form.setValue("combat.toughness_max", newMaxToughness);

      const basePainThreshold = roundUpDiv(vigorous || 0, 2);
      const bonus = painThresholdBonus || 0;
      form.setValue("combat.pain_threshold", basePainThreshold + bonus);
    }
  }, [vigorous, painThresholdBonus, form, isReadOnly]); 


  useEffect(() => {
    const numVal = isNaN(watchedDefense) ? 0 : watchedDefense;
    const displayNum = parseInt(displayDefense, 10) || 0;
    
    if (numVal !== displayNum) {
      setDisplayDefense(numVal === 0 ? "" : String(numVal));
    }
  }, [watchedDefense]);

  const handleDamage = (rawDamage: number) => {
    const armorRD = form.getValues("combat.armor_rd") || 0;
    const painThreshold = form.getValues("combat.pain_threshold") || 0; 
    const currentToughness = form.getValues("combat.toughness_current") || 0;

    const actualDamage = Math.max(0, rawDamage - armorRD);
    const newToughness = Math.max(0, currentToughness - actualDamage);

    form.setValue("combat.toughness_current", newToughness, { shouldDirty: true });

    toast({
      title: "Dano Aplicado!",
      description: `${rawDamage} (Dano) - ${armorRD} (Armadura) = ${actualDamage} (Dano Real)`,
    });

    if (actualDamage > painThreshold && painThreshold > 0) {
      toast({
        title: "Limiar de Dor Excedido!",
        description: `O dano (${actualDamage}) foi maior que o Limiar de Dor (${painThreshold}). O NPC pode estar atordoado.`,
        variant: "destructive",
      });
    }
  };

  const handleHeal = (healAmount: number) => {
    const currentToughness = form.getValues("combat.toughness_current") || 0;
    const max = isNaN(maxToughness) ? 10 : maxToughness;
    const newToughness = Math.min(max, currentToughness + healAmount);
    
    form.setValue("combat.toughness_current", newToughness, { shouldDirty: true });

    toast({
      title: "Cura Aplicada!",
      description: `+${healAmount} de Vitalidade recuperada.`,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="text-red-500" /> Vitalidade & Armadura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="combat.toughness_current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vitalidade Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-2xl font-bold h-12"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="combat.toughness_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vitalidade Máxima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-2xl font-bold h-12 bg-muted/50"
                        {...field}
                        readOnly // Vitalidade Máxima é automática
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Progress
              value={(currentToughness / (maxToughness || 10)) * 100}
              className="h-2"
            />
            
            {/* --- INÍCIO DA CORREÇÃO DE LAYOUT --- */}
            {/* Adicionado 'items-end' para alinhar os FormItems pela base */}
            <div className="grid grid-cols-3 gap-4 pt-2 items-end">
            {/* --- FIM DA CORREÇÃO DE LAYOUT --- */}
              <FormField
                control={form.control}
                name="combat.armor_rd"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    {/* Removido h-10 */}
                    <FormLabel>Armadura (Redução)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-lg h-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="combat.pain_threshold_bonus"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    {/* Removido h-10 */}
                    <FormLabel>Bônus (Limiar)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-lg h-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="combat.pain_threshold"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    {/* Removido h-10 */}
                    <FormLabel>Limiar de Dor (Total)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-lg h-10 bg-muted/50"
                        {...field}
                        readOnly // O total é sempre read-only
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <DamageHealControl
                label="Dano Bruto"
                buttonLabel="Causar Dano"
                onApply={handleDamage}
              />
              <DamageHealControl
                label="Cura"
                buttonLabel="Curar"
                onApply={handleHeal}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-blue-500" /> Defesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="combat.defense"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Modificador de Defesa (Fixo)</FormLabel>
                  <FormControl>
                    <Input
                      type="text" 
                      className="text-2xl font-bold h-12"
                      placeholder="0"
                      value={
                        field.value === undefined || isNaN(field.value)
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || val === "-") {
                          setDisplayDefense(val);
                          field.onChange(0); 
                        } else if (/^-?\d*$/.test(val)) {
                          setDisplayDefense(val);
                          const num = parseInt(val, 10);
                          field.onChange(isNaN(num) ? 0 : num);
                        }
                      }}
                      onBlur={field.onBlur}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Este é um modificador fixo (ex: -3 ou +2) que se aplica à rolagem
              de ataque do Oponente. Não é uma rolagem.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};