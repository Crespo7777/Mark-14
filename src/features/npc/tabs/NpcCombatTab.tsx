// src/features/npc/tabs/NpcCombatTab.tsx

import { useState, useEffect } from "react"; // Importar useEffect
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
        // Este botão não precisa ser desabilitado, pois é de rolagem
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onApply(amount)}
        // Este botão não precisa ser desabilitado
      >
        {buttonLabel}
      </Button>
    </div>
  );
};

export const NpcCombatTab = () => {
  // --- 1. OBTER 'isReadOnly' ---
  const { form, npc, isReadOnly } = useNpcSheet(); 
  const { toast } = useToast(); 

  const currentToughness = form.watch("combat.toughness_current");
  const maxToughness = form.watch("combat.toughness_max");

  // Estado local para o display de Defesa
  const [displayDefense, setDisplayDefense] = useState<string>(() => {
    const val = form.getValues("combat.defense");
    return val === 0 || isNaN(val) ? "" : String(val);
  });
  
  const watchedDefense = form.watch("combat.defense");

  useEffect(() => {
    const numVal = isNaN(watchedDefense) ? 0 : watchedDefense;
    const displayNum = parseInt(displayDefense, 10) || 0;
    
    if (numVal !== displayNum) {
      setDisplayDefense(numVal === 0 ? "" : String(numVal));
    }
  }, [watchedDefense]);

  // (handleDamage e handleHeal... sem alterações)
  const handleDamage = (rawDamage: number) => { /* ... */ };
  const handleHeal = (healAmount: number) => { /* ... */ };

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
                        readOnly={isReadOnly} // <-- 2. ADICIONADO
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
                        className="text-2xl font-bold h-12"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly} // <-- 2. ADICIONADO
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <FormField
                control={form.control}
                name="combat.armor_rd"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Armadura (Redução)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-lg h-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly} // <-- 2. ADICIONADO
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
                    <FormLabel>Limiar de Dor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-lg h-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        readOnly={isReadOnly} // <-- 2. ADICIONADO
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estes botões de Dano/Cura permanecem HABILITADOS */}
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
                      readOnly={isReadOnly} // <-- 2. ADICIONADO
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