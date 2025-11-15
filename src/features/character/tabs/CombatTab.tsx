// src/features/character/tabs/CombatTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
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
import { Heart, Shield } from "lucide-react";
// --- INÍCIO DA CORREÇÃO ---
import { Separator } from "@/components/ui/separator";
import { roundUpDiv } from "../character.schema";
// --- FIM DA CORREÇÃO ---


/**
 * Componente de UI reutilizável para aplicar dano/cura
 * Ajustado com w-16 para ficar mais compacto
 */
const DamageHealControl = ({
  label,
  onApply,
  // disabled, // Removido
}: {
  label: string;
  onApply: (amount: number) => void;
  disabled: boolean; // Mantido na props por segurança, mas não o usamos mais
}) => {
  const [amount, setAmount] = useState(1);
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-16 h-9 text-center" // Reduzido para w-16
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
        // disabled={disabled} // Removido
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onApply(amount)}
        // disabled={disabled} // Removido
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
  // ATUALIZADO: isEditing removido
  const { form /*, isEditing*/ } = useCharacterSheet();
  const { toughnessMax, painThreshold, corruptionThreshold, vigorous } = // <-- Adicionado vigorous
    useCharacterCalculations();
  const currentToughness = form.watch("toughness.current");

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
              <FormItem className="space-y-2">
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
                      field.onChange(Math.min(toughnessMax, Math.max(0, val)));
                    }}
                    // readOnly={!isEditing} // Removido
                  />
                </FormControl>
                <Progress
                  value={(field.value / toughnessMax) * 100}
                  className="h-2"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-2">
            <FormField
              control={form.control}
              name="toughness.bonus"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-y-0">
                  <FormLabel className="text-muted-foreground text-sm">
                    Bônus Vitalidade:
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20 h-8 text-center" // w-20 é bom aqui
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                      // readOnly={!isEditing} // Removido
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* --- INÍCIO DA CORREÇÃO: Bloco Limiar de Dor --- */}
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Limiar de Dor (Base):</span>
              <span className="font-medium">{roundUpDiv(vigorous || 0, 2)}</span>
            </div>

            <FormField
              control={form.control}
              name="painThresholdBonus"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-y-0">
                  <FormLabel className="text-muted-foreground text-sm">
                    Bônus Limiar de Dor:
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center text-base pt-1">
              <span className="text-foreground font-semibold">Limiar de Dor Total:</span>
              <span className="font-bold text-lg">{painThreshold}</span>
            </div>
            {/* --- FIM DA CORREÇÃO --- */}

          </div>

          {/* Controles de Dano/Cura movidos para dentro do CardContent */}
          <div className="flex flex-wrap gap-4 pt-4">
            <DamageHealControl
              label="Causar Dano"
              onApply={handleDamage}
              disabled={false} // Removido !isEditing
            />
            <DamageHealControl
              label="Curar"
              onApply={handleHeal}
              disabled={false} // Removido !isEditing
            />
          </div>
        </CardContent>
        {/* CardFooter foi removido */}
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
              <FormItem className="space-y-2">
                <FormLabel>Corrupção Temporária</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="text-2xl font-bold h-12"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                    // readOnly={!isEditing} // Removido
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Limiar de Corrupção:
              </span>
              <span className="font-medium">{corruptionThreshold}</span>
            </div>

            <FormField
              control={form.control}
              name="corruption.permanent"
              render={({ field }) => (
                <FormItem className="flex justify-between items-center space-y-0">
                  <FormLabel className="text-muted-foreground text-sm">
                    Corrupção Permanente:
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                      // readOnly={!isEditing} // Removido
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