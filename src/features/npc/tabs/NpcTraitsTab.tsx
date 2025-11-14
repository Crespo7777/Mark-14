// src/features/npc/tabs/NpcTraitsTab.tsx

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { getDefaultTrait } from "@/features/character/character.schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const NpcTraitsTab = () => {
  // --- 1. OBTER 'isReadOnly' ---
  const { form, isReadOnly } = useNpcSheet();
  
  const [openItems, setOpenItems] = useState<string[]>([]);

  const {
    fields: traitFields,
    append: appendTrait,
    remove: removeTrait,
  } = useFieldArray({
    control: form.control,
    name: "traits",
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
          onClick={() => appendTrait(getDefaultTrait())}
          disabled={isReadOnly} // <-- 2. ADICIONADO
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Traço
        </Button>
      </CardHeader>
      <CardContent>
        {traitFields.length === 0 && (
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
          {traitFields.map((field, index) => (
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
                    onClick={() => removeTrait(index)}
                    disabled={isReadOnly} // <-- 2. ADICIONADO
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                {/* --- 3. ADICIONAR readOnly/disabled AOS CAMPOS --- */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`traits.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do Traço / Dádiva / Fardo"
                              {...field}
                              readOnly={isReadOnly} // <-- ADICIONADO
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`traits.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isReadOnly} // <-- ADICIONADO
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
                    control={form.control}
                    name={`traits.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Regras)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o traço, seus efeitos, etc..."
                            {...field}
                            className="min-h-[80px] text-sm"
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