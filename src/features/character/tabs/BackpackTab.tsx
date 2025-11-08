// src/features/character/tabs/BackpackTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Backpack,
  Coins,
  Gem,
  TrendingUp,
  Weight,
} from "lucide-react";
import { getDefaultInventoryItem } from "../character.schema";
import { Separator } from "@/components/ui/separator";

// Sub-componente para gerenciar o dinheiro
const MoneyManager = () => {
  const {
    form: { setValue, getValues },
    isEditing,
  } = useCharacterSheet();
  const [amount, setAmount] = useState(1);
  const [currency, setCurrency] = useState<"taler" | "shekel" | "ortega">(
    "ortega",
  );

  const handleAdjustMoney = (operation: "add" | "spend") => {
    const currentMoney = getValues("money");
    let totalOrtegas =
      (currentMoney.taler * 100) +
      (currentMoney.shekel * 10) +
      currentMoney.ortega;

    let amountInOrtegas = 0;
    if (currency === "taler") amountInOrtegas = amount * 100;
    else if (currency === "shekel") amountInOrtegas = amount * 10;
    else amountInOrtegas = amount;

    if (operation === "spend") {
      totalOrtegas -= amountInOrtegas;
    } else {
      totalOrtegas += amountInOrtegas;
    }

    if (totalOrtegas < 0) totalOrtegas = 0; // Não pode ficar negativo

    // Converter de volta para T/S/O
    const newTaler = Math.floor(totalOrtegas / 100);
    const newShekel = Math.floor((totalOrtegas % 100) / 10);
    const newOrtega = totalOrtegas % 10;

    // Atualiza o formulário
    setValue("money.taler", newTaler, { shouldDirty: true });
    setValue("money.shekel", newShekel, { shouldDirty: true });
    setValue("money.ortega", newOrtega, { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="number"
          className="w-20 h-9"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
          disabled={!isEditing}
        />
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as any)}
          disabled={!isEditing}
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="taler">Táler</SelectItem>
            <SelectItem value="shekel">Xelim</SelectItem>
            <SelectItem value="ortega">Ortega</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={() => handleAdjustMoney("add")}
          disabled={!isEditing}
        >
          Adicionar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => handleAdjustMoney("spend")}
          disabled={!isEditing}
        >
          Gastar
        </Button>
      </div>
    </div>
  );
};

export const BackpackTab = () => {
  const { form, isEditing } = useCharacterSheet();
  const {
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
    vigorous,
  } = useCharacterCalculations();

  const {
    fields: inventoryFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "inventory",
  });

  // *** CORREÇÃO AQUI ***
  // 1. Usar form.watch() para os campos de dinheiro
  const [taler, shekel, ortega] = form.watch([
    "money.taler",
    "money.shekel",
    "money.ortega",
  ]);
  
  // 2. Calcular o total com base nos valores assistidos
  const totalOrtegas = (taler * 100) + (shekel * 10) + ortega;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Dinheiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins /> Dinheiro
            </CardTitle>
            {/* 3. O total agora é reativo */}
            <CardDescription>
              Total: {totalOrtegas.toLocaleString("pt-BR")} Ortegas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="money.taler"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Gem className="w-4 h-4 text-blue-400" /> Táler
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-24 h-9"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="money.shekel"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Gem className="w-4 h-4 text-gray-400" /> Xelim
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-24 h-9"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="money.ortega"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Gem className="w-4 h-4 text-yellow-600" /> Ortega
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="w-24 h-9"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator />
            <MoneyManager />
          </CardContent>
        </Card>

        {/* Coluna 2: Experiência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp /> Experiência
            </CardTitle>
            <CardDescription>Disponível: {currentExperience}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="experience.total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total de XP Ganho</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience.spent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total de XP Gasto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEditing}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Coluna 3: Carga & Peso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight /> Carga & Peso
            </CardTitle>
            <CardDescription>
              Penalidade na Defesa: -{encumbrancePenalty}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Peso Atual (Inventário):
              </span>
              <span className="font-medium">{currentWeight}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Limiar de Carga (Vigoroso):
              </span>
              <span className="font-medium">{encumbranceThreshold}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Carga Máxima (Vigoroso x2):
              </span>
              <span className="font-medium">{maxEncumbrance}</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Você pode carregar até seu Vigoroso ({vigorous}) em peso sem
              penalidades. Acima disso, cada ponto de peso lhe dá -1 na Defesa.
              Se o peso atual atingir sua Carga Máxima ({maxEncumbrance}), você
              não pode se mover.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Inventário */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Backpack /> Inventário (Mochila)
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendItem(getDefaultInventoryItem())}
            disabled={!isEditing}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {inventoryFields.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              Mochila vazia.
            </p>
          )}
          {inventoryFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 rounded-md border bg-muted/20 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  {form.watch(`inventory.${index}.name`) || "Novo Item"}
                </h4>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeItem(index)}
                  disabled={!isEditing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`inventory.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Item</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tocha"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`inventory.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`inventory.${index}.weight`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (Obstrutivo)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`inventory.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do item..."
                        {...field}
                        readOnly={!isEditing}
                        className="min-h-[60px] text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};