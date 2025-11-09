// src/features/npc/tabs/NpcSkillsTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext"; // <-- USA O HOOK DO NPC
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
// O schema do NPC importa o 'abilitySchema' correto
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
import { cn } from "@/lib/utils";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog"; // <-- USA O DIÁLOGO DO NPC

// Tipo para os dados da rolagem (sem corrupção)
type AbilityRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
};

export const NpcSkillsTab = () => { // <-- Nome do Componente
  const { form, npc } = useNpcSheet(); // <-- USA O HOOK DO NPC
  const [selectedAbilityRoll, setSelectedAbilityRoll] =
    useState<AbilityRollData | null>(null);

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
    
    const selectedAttr = attributesList.find(
      (attr) => attr.key === ability.associatedAttribute,
    );

    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes]
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: attributeValue,
      // corruptionCost removido
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap /> Habilidades, Poderes & Rituais
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendAbility(getDefaultAbility())}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {abilityFields.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              Nenhuma habilidade adicionada.
            </p>
          )}

          <Accordion type="multiple" className="space-y-4">
            {abilityFields.map((field, index) => (
              <AccordionItem
                key={field.id}
                value={field.id}
                className="p-3 rounded-md border bg-muted/20" 
              >
                <AccordionTrigger className="p-0 hover:no-underline">
                  <div className="flex justify-between items-center w-full">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate">
                        {form.watch(`abilities.${index}.name`) || "Nova Habilidade"}
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="px-1.5 py-0.5">
                          {form.watch(`abilities.${index}.level`)}
                        </Badge>
                        <Badge variant="outline" className="px-1.5 py-0.5">
                          {attributesList.find(
                            (a) => a.key === form.watch(`abilities.${index}.associatedAttribute`)
                          )?.label || "N/A"}
                        </Badge>
                        {/* Badge de Custo de Corrupção REMOVIDO */}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 pl-2" onClick={(e) => e.stopPropagation()}> 
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleRollClick(index)}
                        disabled={
                          form.watch(`abilities.${index}.associatedAttribute`) === "Nenhum"
                        }
                      >
                        <Dices className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Rolar</span>
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
                </AccordionTrigger>
                
                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome da Habilidade / Poder"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`abilities.${index}.level`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                              </FormControl>
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
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

                    {/* Campo Custo Corrupção REMOVIDO */}
                    <FormField
                      control={form.control}
                      name={`abilities.${index}.associatedAttribute`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atributo Associado (para rolagem)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o atributo..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Nenhum">Nenhum</SelectItem>
                              <Separator />
                              {attributesList.map((attr) => (
                                <SelectItem key={attr.key} value={attr.key}>
                                  {attr.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`abilities.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (Regras)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva a habilidade, seus efeitos, etc..."
                              {...field}
                              className="min-h-[80px] text-sm"
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

      {/* Chama o NOVO diálogo de rolagem do NPC */}
      {selectedAbilityRoll && (
        <NpcAbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => {
            if (!open) setSelectedAbilityRoll(null);
          }}
          {...selectedAbilityRoll}
        />
      )}
    </>
  );
};