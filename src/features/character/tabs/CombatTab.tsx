import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Minus, Plus, Heart, Shield } from "lucide-react";

/**
 * Componente de UI reutilizável para aplicar dano/cura
 */
const DamageHealControl = ({
  label,
  onApply,
  disabled,
}: {
  label: string;
  onApply: (amount: number) => void;
  disabled: boolean;
}) => {
  const [amount, setAmount] = useState(1);
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-20 h-9 text-center"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
        disabled={disabled}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onApply(amount)}
        disabled={disabled}
      >
        {label}
      </Button>
    </div>
  );
};

/**
 * A aba de Combate, focada em Vitalidade e Corrupção.
 */
export const CombatTab = () => {
  // Pega o "cérebro" (contexto)
  const { form, isEditing } = useCharacterSheet();

  // Pega os cálculos do nosso Hook de lógica
  const { toughnessMax, painThreshold, corruptionThreshold } = useCharacterCalculations();

  // Pega o valor ATUAL de vitalidade para os botões
  const currentToughness = form.watch("toughness.current");

  // Funções de automação para Dano/Cura (Regra: não pode ser > max ou < 0)
  const handleDamage = (amount: number) => {
    const newValue = Math.max(0, currentToughness - amount);
    form.setValue("toughness.current", newValue, { shouldDirty: true });
  };

  const handleHeal = (amount: number) => {
    const newValue = Math.min(toughnessMax, currentToughness + amount);
    form.setValue("toughness.current", newValue, { shouldDirty: true });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CARD DE VITALIDADE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="text-red-500" /> Vitalidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="toughness.current"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-baseline">
                  <FormLabel>Vitalidade Atual</FormLabel>
                  <span className="text-sm text-muted-foreground">
                    Máximo: {toughnessMax}
                  </span>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    className="text-2xl font-bold h-12"
                    {...field}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      // Validação: não deixa digitar valor maior que o máximo
                      field.onChange(Math.min(toughnessMax, Math.max(0, val)));
                    }}
                    readOnly={!isEditing}
                  />
                </FormControl>
                <Progress value={(field.value / toughnessMax) * 100} className="h-2" />
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Limiar de Dor:</span>
              <span className="font-medium">{painThreshold}</span>
            </div>
            <FormField
              control={form.control}
              name="toughness.bonus"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center">
                  <FormLabel className="text-muted-foreground">Bônus Vitalidade:</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <DamageHealControl label="Causar Dano" onApply={handleDamage} disabled={!isEditing} />
          <DamageHealControl label="Curar" onApply={handleHeal} disabled={!isEditing} />
        </CardFooter>
      </Card>

      {/* CARD DE CORRUPÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-purple-500" /> Corrupção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="corruption.temporary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Corrupção Temporária</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="text-2xl font-bold h-12"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    readOnly={!isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Limiar de Corrupção:</span>
              <span className="font-medium">{corruptionThreshold}</span>
            </div>
            <FormField
              control={form.control}
              name="corruption.permanent"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center">
                  <FormLabel className="text-muted-foreground">Corrupção Permanente:</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
};