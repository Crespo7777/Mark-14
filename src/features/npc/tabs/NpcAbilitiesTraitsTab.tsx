// src/features/npc/tabs/NpcAbilitiesTraitsTab.tsx

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
import { Plus, Trash2, Zap, Dices } from "lucide-react";
import { getDefaultAbility } from "@/features/character/character.schema";
import { attributesList } from "@/features/character/character.constants";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog";
import { useToast } from "@/hooks/use-toast";
import { SharedTraitList } from "@/components/SharedTraitList";

type AbilityRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
};

export const NpcAbilitiesTraitsTab = () => {
  const { form, isReadOnly } = useNpcSheet();
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<AbilityRollData | null>(null);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    fields: abilityFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  const handleRollClick = (index: number) => {
    const ability = form.getValues(`abilities.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === ability.associatedAttribute);
    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes].value
      : 0;

    if (attributeValue === 0 || !selectedAttr) {
      toast({ title: "Atributo não definido", description: "Selecione um Atributo Associado.", variant: "destructive" });
      return;
    }

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: attributeValue,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* --- 1. TRAÇOS (Primeiro, igual à ficha de personagem) --- */}
      <SharedTraitList control={form.control} name="traits" isReadOnly={isReadOnly} />

      {/* --- 2. HABILIDADES --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap /> Habilidades & Poderes
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendAbility(getDefaultAbility())}
            disabled={isReadOnly}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {abilityFields.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma habilidade adicionada.
            </p>
          )}

          <Accordion
            type="multiple"
            className="space-y-4"
            value={openItems}
            onValueChange={setOpenItems}
          >
            {abilityFields.map((field, index) => (
              <AccordionItem
                key={field.id}
                value={field.id}
                className="p-3 rounded-md border bg-muted/20"
              >
                <div className="flex justify-between items-center w-full p-0">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate">
                        {form.watch(`abilities.${index}.name`) || "Nova Habilidade"}
                      </h4>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <Badge variant="secondary" className="px-1.5 py-0.5">
                          {form.watch(`abilities.${index}.level`)}
                        </Badge>
                        <Badge variant="outline" className="px-1.5 py-0.5">
                          {attributesList.find((a) => a.key === form.watch(`abilities.${index}.associatedAttribute`))?.label || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div className="flex gap-1 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button type="button" size="sm" onClick={() => handleRollClick(index)}>
                      <Dices className="w-4 h-4" /><span className="hidden sm:inline ml-2">Rolar</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAbility(index)}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name={`abilities.${index}.name`} render={({ field }) => (
                          <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome da Habilidade" {...field} readOnly={isReadOnly}/></FormControl></FormItem>
                      )}/>
                      <FormField control={form.control} name={`abilities.${index}.level`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Novato">Novato</SelectItem><SelectItem value="Adepto">Adepto</SelectItem><SelectItem value="Mestre">Mestre</SelectItem></SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                      <FormField control={form.control} name={`abilities.${index}.type`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name={`abilities.${index}.associatedAttribute`} render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Atributo Associado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Nenhum">Nenhum</SelectItem><Separator />
                                {attributesList.map((attr) => (<SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                      <FormField control={form.control} name={`abilities.${index}.corruptionCost`} render={({ field }) => (
                          <FormItem><FormLabel>Custo Corrupção</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} readOnly={isReadOnly}/></FormControl></FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name={`abilities.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva a habilidade..." {...field} className="min-h-[80px] text-sm" readOnly={isReadOnly}/></FormControl></FormItem>
                      )}/>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {selectedAbilityRoll && (
        <NpcAbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => !open && setSelectedAbilityRoll(null)}
          {...selectedAbilityRoll}
        />
      )}
    </div>
  );
};