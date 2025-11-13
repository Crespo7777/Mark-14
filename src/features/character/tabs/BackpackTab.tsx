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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const MoneyManager = () => {
  const {
    form: { setValue, getValues },
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

    if (totalOrtegas < 0) totalOrtegas = 0;

    const newTaler = Math.floor(totalOrtegas / 100);
    const newShekel = Math.floor((totalOrtegas % 100) / 10);
    const newOrtega = totalOrtegas % 10;

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
        />
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as any)}
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
        >
          Adicionar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => handleAdjustMoney("spend")}
        >
          Gastar
        </Button>
      </div>
    </div>
  );
};

export const BackpackTab = () => {
  const { form } = useCharacterSheet();
  const {
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
    vigorous,
  } = useCharacterCalculations();
  
  // <-- MUDANÇA: Controlar o estado do acordeão
  const [openItems, setOpenItems] = useState<string[]>([]);

  const {
    fields: inventoryFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "inventory",
  });

  const [taler, shekel, ortega] = form.watch([
    "money.taler",
    "money.shekel",
    "money.ortega",
  ]);

  const totalOrtegas = taler * 100 + shekel * 10 + ortega;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins /> Dinheiro
            </CardTitle>
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator />
            <MoneyManager />
          </CardContent>
        </Card>

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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Backpack /> Inventário (Mochila)
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendItem(getDefaultInventoryItem())}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Item
          </Button>
        </CardHeader>
        <CardContent>
          {inventoryFields.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              Mochila vazia.
            </p>
          )}

          {/* <-- MUDANÇA: Acordeão controlado --> */}
          <Accordion
            type="multiple"
            className="space-y-4"
            value={openItems}
            onValueChange={setOpenItems}
          >
            {inventoryFields.map((field, index) => (
              <AccordionItem
                key={field.id}
                value={field.id}
                className="p-3 rounded-md border bg-muted/20"
              >
                {/* --- INÍCIO DA CORREÇÃO HTML --- */}
                <div className="flex justify-between items-center w-full p-0">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate">
                        {form.watch(`inventory.${index}.name`) || "Novo Item"}
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="px-1.5 py-0.5">
                          Qtd: {form.watch(`inventory.${index}.quantity`) || 0}
                        </Badge>
                        <Badge variant="outline" className="px-1.5 py-0.5">
                          Peso: {form.watch(`inventory.${index}.weight`) || 0}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div
                    className="flex pl-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* --- FIM DA CORREÇÃO --- */}

                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`inventory.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Item</FormLabel>
                            <FormControl>
                              <Input placeholder="Tocha" {...field} />
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
                                  field.onChange(
                                    parseInt(e.target.value) || 0,
                                  )
                                }
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
                                  field.onChange(
                                    parseInt(e.target.value) || 0,
                                  )
                                }
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
                              className="min-h-[60px] text-sm"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};