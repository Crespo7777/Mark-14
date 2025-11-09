// src/features/npc/tabs/NpcCombatTab.tsx

import { useState } from "react";
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
import { Heart, Shield, Dices } from "lucide-react";
import { DefenseRollDialog } from "@/components/DefenseRollDialog"; // Reutilizamos o diálogo de rolagem

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
  const { form } = useNpcSheet();
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

  // Observa os valores do formulário para os cálculos
  const currentToughness = form.watch("combat.toughness_current");
  const maxToughness = form.watch("combat.toughness_max");
  const armorRD = form.watch("combat.armor_rd");
  const defenseValue = form.watch("combat.defense");

  // Lógica de Dano (com Redução de Armadura)
  const handleDamage = (rawDamage: number) => {
    // Calcula o dano líquido (Dano Bruto - Armadura, mínimo 0)
    const netDamage = Math.max(0, rawDamage - (armorRD || 0));
    const newValue = Math.max(0, currentToughness - netDamage);
    
    form.setValue("combat.toughness_current", newValue, { shouldDirty: true });
  };

  // Lógica de Cura
  const handleHeal = (healAmount: number) => {
    const newValue = Math.min(maxToughness, currentToughness + healAmount);
    form.setValue("combat.toughness_current", newValue, { shouldDirty: true });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD DE VITALIDADE + ARMADURA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="text-red-500" /> Vitalidade & Armadura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vitalidade Atual e Máxima */}
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
            
            <FormField
              control={form.control}
              name="combat.armor_rd"
              render={({ field }) => (
                <FormItem className="space-y-2 pt-2">
                  <FormLabel>Armadura (Redução de Dano Fixo)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="text-lg h-10 w-24"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Controles de Dano/Cura */}
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

        {/* CARD DE DEFESA FIXA */}
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
                  <FormLabel>Defesa (Valor Fixo)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="text-2xl font-bold h-12"
                      placeholder="10"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Este é o valor alvo para o teste de Defesa (1d20). Pode ser negativo (ex: -3) ou positivo (ex: +2).
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsDefenseRollOpen(true)}
            >
              <Dices className="w-4 h-4" />
              Rolar Defesa (vs {defenseValue})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Rolagem de Defesa */}
      <DefenseRollDialog
        open={isDefenseRollOpen}
        onOpenChange={setIsDefenseRollOpen}
        defenseValue={defenseValue}
      />
    </>
  );
};