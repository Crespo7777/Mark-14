// src/features/npc/tabs/NpcBackpackTab.tsx

import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Backpack } from "lucide-react";
import { getDefaultInventoryItem } from "@/features/character/character.schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const NpcBackpackTab = () => {
  const { form } = useNpcSheet();

  const {
    fields: inventoryFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "inventory",
  });

  return (
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

        <Accordion type="multiple" className="space-y-4">
          {inventoryFields.map((field, index) => (
            <AccordionItem
              key={field.id}
              value={field.id}
              className="p-3 rounded-md border bg-muted/20"
            >
              <AccordionTrigger className="p-0 hover:no-underline">
                <div className="flex justify-between items-center w-full">
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
                  <div className="flex pl-2" onClick={(e) => e.stopPropagation()}>
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
              </AccordionTrigger>
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
                                field.onChange(parseInt(e.target.value) || 0)
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
                                field.onChange(parseInt(e.target.value) || 0)
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
  );
};