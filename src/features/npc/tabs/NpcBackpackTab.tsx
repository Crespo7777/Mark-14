// src/features/npc/tabs/NpcBackpackTab.tsx

import { useState } from "react";
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
  // --- 1. OBTER 'isReadOnly' ---
  const { form, isReadOnly } = useNpcSheet();
  
  const [openItems, setOpenItems] = useState<string[]>([]);

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
          disabled={isReadOnly} // <-- 2. ADICIONADO
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
              <div className="flex justify-between items-center w-full p-0">
                <AccordionTrigger className="p-0 hover:no-underline flex-1">
                  {/* ... (conteúdo do trigger sem alteração) ... */}
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
                    disabled={isReadOnly} // <-- 2. ADICIONADO
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                {/* --- 3. ADICIONAR readOnly AOS CAMPOS --- */}
                <div className="space-y-4">
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
                              readOnly={isReadOnly} // <-- ADICIONADO
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
                                field.onChange(
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              readOnly={isReadOnly} // <-- ADICIONADO
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
                              readOnly={isReadOnly} // <-- ADICIONADO
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
                            readOnly={isReadOnly} // <-- ADICIONADO
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