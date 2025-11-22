// src/components/SharedProjectileList.tsx

import { useState } from "react";
import { Control, useFieldArray, useWatch, useFormContext } from "react-hook-form"; // Adicionado useFormContext
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Crosshair, Minus } from "lucide-react";
import { getDefaultProjectile } from "@/features/character/character.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// --- SUB-COMPONENTE (Item Individual) ---
const ProjectileItem = ({ 
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
  const { toast } = useToast();

  return (
    <AccordionItem value={fieldId} className="p-3 rounded-md border bg-muted/20">
      <div className="flex justify-between items-center w-full p-0">
        <AccordionTrigger className="p-0 hover:no-underline flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
            <h4 className="font-semibold text-base text-primary-foreground truncate">
               {itemName || "Novo Projétil"}
            </h4>
            <Badge variant={itemQtd > 0 ? "secondary" : "destructive"} className="px-1.5 py-0.5">
               Qtd: {itemQtd || 0}
            </Badge>
          </div>
        </AccordionTrigger>

        <div className="flex pl-2 flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${name}.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Munição</FormLabel>
                <FormControl>
                  <Input placeholder="Flechas" {...field} readOnly={isReadOnly} />
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
                  <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        size="icon" 
                        variant="outline" 
                        className="h-10 w-10 shrink-0"
                        onClick={() => {
                            const val = parseInt(field.value) || 0;
                            field.onChange(Math.max(0, val - 1));
                        }}
                        disabled={isReadOnly}
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      className="text-center font-bold"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      readOnly={isReadOnly}
                    />
                    <Button 
                        type="button" 
                        size="icon" 
                        variant="outline" 
                        className="h-10 w-10 shrink-0"
                        onClick={() => {
                            const val = parseInt(field.value) || 0;
                            field.onChange(val + 1);
                        }}
                        disabled={isReadOnly}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface SharedProjectileListProps {
  control: Control<any>;
  name: string; 
  isReadOnly?: boolean;
}

export const SharedProjectileList = ({ control, name, isReadOnly = false }: SharedProjectileListProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  
  // Hook para pegar o ID real do item
  const { getValues } = useFormContext();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crosshair /> Munição (Projéteis)
        </CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => append(getDefaultProjectile())}
          disabled={isReadOnly}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && (
          <p className="text-muted-foreground text-center py-4 text-sm">
            Sem munição.
          </p>
        )}

        <Accordion
          type="multiple"
          className="space-y-3"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {fields.map((field, index) => {
            // CORREÇÃO CRÍTICA: Usar o ID estável do banco de dados, não o do hook-form
            const stableId = getValues(`${name}.${index}.id`) || field.id;
            
            return (
              <ProjectileItem
                key={stableId} // Key estável para evitar remontagem
                fieldId={stableId} // Value estável para manter o acordeão aberto
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