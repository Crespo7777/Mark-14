// src/components/SharedTraitList.tsx

import { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { getDefaultTrait } from "@/features/character/character.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- SUB-COMPONENTE PARA O ITEM INDIVIDUAL ---
// Isto permite usar o useWatch individualmente sem quebrar regras de Hooks
const TraitItem = ({ 
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
  
  // "Ouvir" as alterações nestes campos específicos
  const traitName = useWatch({
    control,
    name: `${name}.${index}.name`,
  });
  
  const traitType = useWatch({
    control,
    name: `${name}.${index}.type`,
  });

  return (
    <AccordionItem
      value={fieldId}
      className="p-3 rounded-md border bg-muted/20"
    >
      <div className="flex justify-between items-center w-full p-0">
        <AccordionTrigger className="p-0 hover:no-underline flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
            <h4 className="font-semibold text-base text-primary-foreground truncate">
               {traitName || "Novo Traço"}
            </h4>
            {traitType && (
                <Badge variant="secondary" className="px-1.5 py-0.5">
                  {traitType}
                </Badge>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name={`${name}.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Traço" {...field} readOnly={isReadOnly} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${name}.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Traço">Traço</SelectItem>
                      <SelectItem value="Dádiva">Dádiva</SelectItem>
                      <SelectItem value="Fardo">Fardo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name={`${name}.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Regras)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o traço, seus efeitos, etc..."
                    {...field}
                    className="min-h-[80px] text-sm"
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

// --- COMPONENTE PRINCIPAL ---

interface SharedTraitListProps {
  control: Control<any>;
  name: string; 
  isReadOnly?: boolean;
}

export const SharedTraitList = ({ control, name, isReadOnly = false }: SharedTraitListProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles /> Traços, Dádivas & Fardos
        </CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => append(getDefaultTrait())}
          disabled={isReadOnly}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Traço
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Nenhum traço, dádiva ou fardo adicionado.
          </p>
        )}

        <Accordion
          type="multiple"
          className="space-y-4"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {fields.map((field, index) => (
            <TraitItem 
              key={field.id}
              fieldId={field.id}
              index={index}
              control={control}
              name={name}
              remove={remove}
              isReadOnly={isReadOnly}
            />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};