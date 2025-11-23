// src/features/character/tabs/AbilitiesTraitsTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; 
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
import { Plus, Trash2, Zap, Dices, Scroll, Hand } from "lucide-react";
import { getDefaultAbility } from "../character.schema";
import { attributesList } from "../character.constants";
import { AbilityRollDialog } from "@/components/AbilityRollDialog";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SharedTraitList } from "@/components/SharedTraitList";
import { useTableContext } from "@/features/table/TableContext";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";

type AbilityRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: string; 
};

export const AbilitiesTraitsTab = () => {
  const { form } = useCharacterSheet();
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<AbilityRollData | null>(null);
  const [openAbilityItems, setOpenAbilityItems] = useState<string[]>([]);
  const { getValues } = useFormContext();
  const { tableId } = useTableContext();

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
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes]
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: attributeValue,
      corruptionCost: String(ability.corruptionCost || "0"),
    });
  };

  const characterName = form.watch("name");

  return (
    <div className="space-y-6">
      
      <SharedTraitList control={form.control} name="traits" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap /> Habilidades, Poderes & Rituais
          </CardTitle>
          
          <ItemSelectorDialog 
              tableId={tableId} 
              category="ability" 
              onSelect={(template) => {
                  if (template) {
                      appendAbility({
                          ...getDefaultAbility(),
                          name: template.name,
                          level: template.data.level || "",
                          type: template.data.type || "",
                          description: template.description || "",
                          corruptionCost: template.data.corruptionCost || "0",
                          associatedAttribute: template.data.associatedAttribute || "Nenhum",
                          tradition: template.data.tradition || ""
                      });
                  } else {
                      appendAbility(getDefaultAbility());
                  }
              }}
          >
              <Button type="button" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
          </ItemSelectorDialog>
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
            value={openAbilityItems}
            onValueChange={setOpenAbilityItems}
          >
            {abilityFields.map((field, index) => {
              const stableId = getValues(`abilities.${index}.id`) || field.id;
              const abilityType = form.watch(`abilities.${index}.type`);
              const hasAttribute = form.watch(`abilities.${index}.associatedAttribute`) !== "Nenhum";
              
              return (
                <AccordionItem
                  key={stableId}
                  value={stableId}
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

                        {form.watch(`abilities.${index}.name`)?.toLowerCase().includes("amoque") && (
                          <div className="flex items-center gap-2 bg-red-900/30 px-2 py-1 rounded-full border border-red-500/50 ml-2" onClick={(e) => e.stopPropagation()}>
                             <Switch
                                checked={form.watch(`abilities.${index}.isActive`)}
                                onCheckedChange={(checked) => {
                                  form.setValue(`abilities.${index}.isActive`, checked, { shouldDirty: true });
                                }}
                                className="scale-75 data-[state=checked]:bg-red-600"
                             />
                             <span className="text-xs font-bold text-red-200">ATIVO</span>
                          </div>
                        )}

                        <Badge variant="outline" className="px-1.5 py-0.5">
                          {attributesList.find(
                            (a) => a.key === form.watch(`abilities.${index}.associatedAttribute`)
                          )?.label || "N/A"}
                        </Badge>
                        
                        {form.watch(`abilities.${index}.corruptionCost`) && form.watch(`abilities.${index}.corruptionCost`) !== "0" && (
                          <Badge variant="destructive" className="px-1.5 py-0.5">
                            Custo: {form.watch(`abilities.${index}.corruptionCost`)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div className="flex gap-1 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      size="sm"
                      variant={hasAttribute ? "default" : "secondary"}
                      onClick={() => handleRollClick(index)}
                    >
                      {hasAttribute ? <Dices className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
                      <span className="hidden sm:inline ml-2">{hasAttribute ? "Rolar" : "Usar"}</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAbility(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl><Input placeholder="Nome da Habilidade" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.level`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Novato">Novato</SelectItem>
                                <SelectItem value="Adepto">Adepto</SelectItem>
                                <SelectItem value="Mestre">Mestre</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Habilidade">Habilidade</SelectItem>
                                <SelectItem value="Poder">Poder</SelectItem>
                                <SelectItem value="Ritual">Ritual</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.associatedAttribute`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Atributo Associado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Nenhum">Nenhum</SelectItem>
                                <Separator />
                                {attributesList.map((attr) => (
                                  <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.corruptionCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo Corrupção</FormLabel>
                            <FormControl>
                              <Input placeholder="0 ou 1d4" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {abilityType === "Ritual" && (
                         <FormField
                            control={form.control}
                            name={`abilities.${index}.tradition`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1 text-purple-400"><Scroll className="w-3 h-3"/> Tradição</FormLabel>
                                <FormControl>
                                    <Input placeholder="Feitiçaria, Teurgia..." {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`abilities.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (Regras)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva a habilidade..." {...field} className="min-h-[80px] text-sm" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {selectedAbilityRoll && (
        <AbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => !open && setSelectedAbilityRoll(null)}
          characterName={characterName}
          tableId={(form.getValues() as any).table_id || ""} 
          {...selectedAbilityRoll}
        />
      )}
    </div>
  );
};