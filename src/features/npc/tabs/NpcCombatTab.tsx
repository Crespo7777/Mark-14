// src/features/npc/tabs/NpcCombatTab.tsx

// --- 1. IMPORTAR 'useEffect' ---
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
  const { form, npc } = useNpcSheet();
  const { toast } = useToast();

  const currentToughness = form.watch("combat.toughness_current");
  const maxToughness = form.watch("combat.toughness_max");

  // --- 2. ESTADO LOCAL PARA O DISPLAY DO INPUT DE DEFESA ---
  // Inicializa o estado local com o valor do formulário
  const [displayDefense, setDisplayDefense] = useState<string>(() => {
    const val = form.getValues("combat.defense");
    return val === 0 || isNaN(val) ? "" : String(val);
  });

  // --- 3. SINCRONIZAR O ESTADO LOCAL ---
  // Observa o valor real do formulário
  const watchedDefense = form.watch("combat.defense");

  useEffect(() => {
    // Sincroniza o display se o valor do formulário mudar
    // (ex: ao carregar dados, resetar, etc.)
    const numVal = isNaN(watchedDefense) ? 0 : watchedDefense;
    const displayNum = parseInt(displayDefense, 10) || 0;

    if (numVal !== displayNum) {
      setDisplayDefense(numVal === 0 ? "" : String(numVal));
    }
  }, [watchedDefense]); // Depende apenas do valor do formulário
  // --- FIM DAS ADIÇÕES ---

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
        {/* CARD DE VITALIDADE + ARMADURA (sem alterações) */}
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

        {/* --- CARD DE DEFESA (COM AS CORREÇÕES) --- */}
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
              render={({ field }) => ( // Usamos o 'field' original
                <FormItem className="space-y-2">
                  <FormLabel>Modificador de Defesa (Fixo)</FormLabel>
                  <FormControl>
                    <Input
                      type="text" // 4. Manter como "text"
                      className="text-2xl font-bold h-12"
                      placeholder="0"
                      
                      // 5. Usar o estado local 'displayDefense' para exibir
                      value={displayDefense}
                      
                      // 6. onChange manual
                      onChange={(e) => {
                        const val = e.target.value;
                        
                        // Regex: permite "", "-", ou "-números" ou "números"
                        if (val === "" || val === "-") {
                          setDisplayDefense(val); // Permite exibir "-"
                          field.onChange(0); // Guarda 0 no RHF (seguro p/ Zod)
                        } else if (/^-?\d*$/.test(val)) {
                          // Se for um número válido (ex: "-3" ou "5")
                          setDisplayDefense(val); // Atualiza display
                          const num = parseInt(val, 10);
                          field.onChange(isNaN(num) ? 0 : num); // Guarda o número
                        }
                        // Ignora entradas inválidas como "abc" ou "--3"
                      }}
                      
                      // 7. Usar o onBlur original para validação
                      onBlur={field.onBlur}
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