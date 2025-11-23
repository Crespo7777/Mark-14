// src/components/SharedInventoryList.tsx

import { useState } from "react";
import { Control, useFieldArray, useWatch, useFormContext } from "react-hook-form"; 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Backpack } from "lucide-react";
import { getDefaultInventoryItem } from "@/features/character/character.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTableContext } from "@/features/table/TableContext"; // <-- Importado
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog"; // <-- Importado

const InventoryItemDisplay = ({ 
  index, 
  fieldId, 
  control, 
  name, 
  remove, 
  isReadOnly 
}: { 
  index: number; 
  fieldId: string; 
  control: Control<any>; 
  name: string; 
  remove: (index: number) => void; 
  isReadOnly: boolean; 
}) => {
  
  const itemName = useWatch({ control, name: `${name}.${index}.name` });
  const itemQtd = useWatch({ control, name: `${name}.${index}.quantity` });
  const itemWeight = useWatch({ control, name: `${name}.${index}.weight` });

  return (
    <AccordionItem value={fieldId} className="p-3 rounded-md border bg-muted/20">
      <div className="flex justify-between items-center w-full p-0">
        <AccordionTrigger className="p-0 hover:no-underline flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
            <h4 className="font-semibold text-base text-primary-foreground truncate">
               {itemName || "Novo Item"}
            </h4>
            <div className="flex gap-1.5">
               <Badge variant="secondary" className="px-1.5 py-0.5">Qtd: {itemQtd || 0}</Badge>
               <Badge variant="outline" className="px-1.5 py-0.5">Peso: {itemWeight || 0}</Badge>
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => remove(index)}
            disabled={isReadOnly}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AccordionContent className="pt-4 mt-3 border-t border-border/50">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name={`${name}.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Tocha" {...field} readOnly={isReadOnly} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${name}.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${name}.${index}.weight`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (Obstrutivo)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name={`${name}.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do item..."
                    {...field}
                    className="min-h-[60px] text-sm"
                    readOnly={isReadOnly}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface SharedInventoryListProps {
  control: Control<any>;
  name: string; 
  isReadOnly?: boolean;
  title?: string;
}

export const SharedInventoryList = ({
  control,
  name,
  isReadOnly = false,
  title = "Inventário (Mochila)",
}: SharedInventoryListProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  
  const { getValues } = useFormContext();
  const { tableId } = useTableContext(); // <-- Obter tableId

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Backpack /> {title}
        </CardTitle>
        
        {/* Botão Integrado com Database */}
        <ItemSelectorDialog 
            tableId={tableId} 
            category="item" 
            onSelect={(template) => {
                if (template) {
                    append({
                        ...getDefaultInventoryItem(),
                        name: template.name,
                        weight: template.weight,
                        description: template.description || ""
                    });
                } else {
                    append(getDefaultInventoryItem());
                }
            }}
        >
            <Button type="button" size="sm" disabled={isReadOnly}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Item
            </Button>
        </ItemSelectorDialog>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && (
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
          {fields.map((field, index) => {
            const stableId = getValues(`${name}.${index}.id`) || field.id;
            return (
              <InventoryItemDisplay
                key={stableId}
                fieldId={stableId}
                index={index}
                control={control}
                name={name}
                remove={remove}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};