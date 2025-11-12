// src/features/npc/tabs/NpcCombatTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext"; // ATUALIZADO
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
// --- 1. 'Dices' e 'DefenseRollDialog' REMOVIDOS ---
import { Heart, Shield, ShieldAlert } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast"; 
// --- FIM DA REMOÇÃO ---

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
  const { form, npc } = useNpcSheet(); // ATUALIZADO: Pegar o 'npc'
  
  // --- 2. 'isDefenseRollOpen' REMOVIDO ---
  // const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);
  // --- FIM DA REMOÇÃO ---

  const { toast } = useToast(); 

  // Observa os valores do formulário para os cálculos
  const currentToughness = form.watch("combat.toughness_current");
  const maxToughness = form.watch("combat.toughness_max");
  // const defenseValue = form.watch("combat.defense"); // Já não precisamos de o observar

  const handleDamage = (rawDamage: number) => {
    const armorRD = form.getValues("combat.armor_rd") || 0;
    const painThreshold = form.getValues("combat.pain_threshold") || 0;
    const currentToughness = form.getValues("combat.toughness_current");

    const netDamage = Math.max(0, rawDamage - armorRD);
    const newValue = Math.max(0, currentToughness - netDamage);
    form.setValue("combat.toughness_current", newValue, { shouldDirty: true });

    toast({
      title: "Dano Recebido!",
      description: `${npc.name} sofreu ${netDamage} de dano (Dano Bruto: ${rawDamage}, Armadura: ${armorRD}).`,
    });

    if (netDamage > 0 && netDamage >= painThreshold) {
      toast({
        title: "Limiar de Dor Ultrapassado!",
        description: `${npc.name} sofreu ${netDamage} de dano (Limiar: ${painThreshold}) e pode precisar fazer um teste!`,
        variant: "destructive", 
        action: (
          <div className="flex items-center gap-2 text-destructive-foreground/80">
            <ShieldAlert className="w-4 h-4" /> Aviso
          </div>
        ),
      });
    }
  };

  const handleHeal = (healAmount: number) => {
    const currentToughness = form.getValues("combat.toughness_current");
    const maxToughness = form.getValues("combat.toughness_max");

    const newValue = Math.min(maxToughness, currentToughness + healAmount);
    form.setValue("combat.toughness_current", newValue, { shouldDirty: true });

    toast({
      title: "Cura Recebida",
      description: `${npc.name} recuperou ${healAmount} de vitalidade.`,
    });
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

        {/* --- 3. CARD DE DEFESA MODIFICADO --- */}
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
                      type="number"
                      className="text-2xl font-bold h-12"
                      placeholder="0"
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
              Este é um modificador fixo (ex: -3 ou +2) que se aplica à rolagem de ataque do Oponente. Não é uma rolagem.
            </p>
            {/* O BOTÃO DE ROLAGEM FOI REMOVIDO DAQUI */}
          </CardContent>
        </Card>
        {/* --- FIM DA MODIFICAÇÃO --- */}

      </div>

      {/* --- 4. DIÁLOGO DE ROLAGEM REMOVIDO --- */}
      {/* <DefenseRollDialog
        open={isDefenseRollOpen}
        onOpenChange={setIsDefenseRollOpen}
        defenseValue={defenseValue}
        characterName={npc.name}
        tableId={npc.table_id}
      /> 
      */}
    </>
  );
};