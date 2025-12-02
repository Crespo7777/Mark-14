import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, Dices, Hand, Database, PenTool, Dna } from "lucide-react"; 
import { getDefaultAbility } from "@/features/character/character.schema";
import { attributesList } from "@/features/character/character.constants";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog";
import { useToast } from "@/hooks/use-toast";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type AbilityRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: string;
};

export const NpcAbilitiesTraitsTab = () => {
  // CORREÇÃO: Garantir que 'npc' é extraído do contexto
  const { form, npc, isReadOnly } = useNpcSheet();
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<AbilityRollData | null>(null);
  const { toast } = useToast();
  const { getValues } = useFormContext();

  // Estados dos Accordions
  const [openAbilities, setOpenAbilities] = useState<string[]>([]);
  const [openTraits, setOpenTraits] = useState<string[]>([]);

  // Estados dos Seletores
  const [isAbilityDbOpen, setIsAbilityDbOpen] = useState(false);
  const [isTraitDbOpen, setIsTraitDbOpen] = useState(false);

  // --- FIELD ARRAYS ---
  const {
    fields: abilityFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({ control: form.control, name: "abilities" });

  const {
    fields: traitFields,
    append: appendTrait,
    remove: removeTrait,
  } = useFieldArray({ control: form.control, name: "traits" });

  // --- HANDLERS: HABILIDADES ---
  const handleAddAbilityFromDb = (item: any) => {
      const newAbility = getDefaultAbility();
      newAbility.name = item.name;
      newAbility.description = item.description || "";
      
      if (item.data) {
          newAbility.level = item.data.level || "";
          newAbility.type = item.data.type || "Habilidade";
          newAbility.associatedAttribute = item.data.associatedAttribute || "";
          newAbility.corruptionCost = String(item.data.corruptionCost || "0");
      }
      appendAbility(newAbility);
      toast({ title: "Adicionado", description: `${item.name} adicionado.` });
  };

  const handleManualAbility = () => {
      appendAbility(getDefaultAbility());
  };

  // --- HANDLERS: TRAÇOS ---
  const handleAddTraitFromDb = (item: any) => {
      const data = item.data || {};
      appendTrait({
          name: item.name,
          description: item.description || "",
          type: data.type || "Traço",
          cost: data.cost || "",
          level: data.level || "", 
          effect: data.effect || "" 
      });
      toast({ title: "Adicionado", description: `${item.name} adicionado.` });
  };

  const handleManualTrait = () => {
      appendTrait({
          name: "Novo Traço",
          description: "",
          type: "Traço",
          level: "", 
          cost: "",
          effect: ""
      });
  };

  // --- HANDLER DE ROLAGEM ---
  const handleRollClick = (index: number) => {
    const ability = form.getValues(`abilities.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === ability.associatedAttribute);
    
    const attributeValue = selectedAttr
      ? Number(allAttributes[selectedAttr.key as keyof typeof allAttributes]?.value || 0)
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: attributeValue,
      corruptionCost: String(ability.corruptionCost || "0"),
    });
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* --- SEÇÃO 1: TRAÇOS, DÁDIVAS & FARDOS --- */}
      <Card className="flex flex-col border-t-4 border-t-purple-500 shadow-sm">
        <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
                <Dna className="w-4 h-4 text-purple-500" /> Traços, Dádivas & Fardos
            </CardTitle>
            {!isReadOnly && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsTraitDbOpen(true)}>
                            <Database className="w-4 h-4 mr-2" /> Buscar no Banco
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleManualTrait}>
                            <PenTool className="w-4 h-4 mr-2" /> Criar Manualmente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </CardHeader>
        <CardContent className="p-2">
            {traitFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">
                    Nenhum traço ou dádiva.
                </div>
            )}
            <Accordion type="multiple" className="space-y-2" value={openTraits} onValueChange={setOpenTraits}>
                {traitFields.map((field, index) => (
                    <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                        <div className="flex items-center justify-between py-2">
                            <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                <div className="flex flex-col items-start text-left gap-1">
                                    <span className="font-semibold text-sm">{form.watch(`traits.${index}.name`) || "Novo Traço"}</span>
                                    <div className="flex gap-1">
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-muted">
                                            {form.watch(`traits.${index}.type`) || "Traço"}
                                        </Badge>
                                        {/* Badge condicional de nível (ignora "none" ou vazio) */}
                                        {form.watch(`traits.${index}.level`) && form.watch(`traits.${index}.level`) !== "none" && (
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                                {form.watch(`traits.${index}.level`)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-50 hover:opacity-100 text-destructive"
                                onClick={() => removeTrait(index)}
                                disabled={isReadOnly}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                        <AccordionContent className="border-t pt-2 space-y-3">
                            <div className="grid grid-cols-4 gap-2">
                                <FormField control={form.control} name={`traits.${index}.name`} render={({ field }) => (
                                    <div className="col-span-2 space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                                )}/>
                                <FormField control={form.control} name={`traits.${index}.type`} render={({ field }) => (
                                    <FormItem className="col-span-1 space-y-1">
                                        <FormLabel className="text-[10px]">Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Traço">Traço</SelectItem>
                                                <SelectItem value="Dádiva">Dádiva</SelectItem>
                                                <SelectItem value="Fardo">Fardo</SelectItem>
                                                <SelectItem value="Monstruoso">Traço de Criatura</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`traits.${index}.level`} render={({ field }) => (
                                    <FormItem className="col-span-1 space-y-1">
                                        <FormLabel className="text-[10px]">Nível (Opcional)</FormLabel>
                                        <Select 
                                            onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                                            value={field.value || "none"} 
                                            disabled={isReadOnly}
                                        >
                                            <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Sem nível</SelectItem>
                                                <SelectItem value="Novato">Novato</SelectItem>
                                                <SelectItem value="Adepto">Adepto</SelectItem>
                                                <SelectItem value="Mestre">Mestre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name={`traits.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px]">Descrição / Efeito</FormLabel><FormControl><Textarea {...field} className="min-h-[60px] text-xs" readOnly={isReadOnly}/></FormControl></FormItem>
                            )}/>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>

      {/* --- SEÇÃO 2: HABILIDADES & PODERES --- */}
      <Card className="flex flex-col border-t-4 border-t-yellow-500 shadow-sm">
        <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-yellow-500" /> Habilidades & Poderes
          </CardTitle>
          {!isReadOnly && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsAbilityDbOpen(true)}>
                            <Database className="w-4 h-4 mr-2" /> Buscar no Banco
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleManualAbility}>
                            <PenTool className="w-4 h-4 mr-2" /> Criar Manualmente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </CardHeader>
        <CardContent className="p-2">
          {abilityFields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">
              Nenhuma habilidade adicionada.
            </div>
          )}

          <Accordion type="multiple" className="space-y-2" value={openAbilities} onValueChange={setOpenAbilities}>
            {abilityFields.map((field, index) => {
              const stableId = getValues(`abilities.${index}.id`) || field.id;
              const hasAttribute = form.watch(`abilities.${index}.associatedAttribute`) !== "Nenhum" && !!form.watch(`abilities.${index}.associatedAttribute`);

              return (
              <AccordionItem key={stableId} value={stableId} className="border rounded bg-card px-2">
                <div className="flex justify-between items-center py-2">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                    <div className="flex flex-col items-start text-left gap-1">
                      <span className="font-semibold text-sm">{form.watch(`abilities.${index}.name`) || "Nova Habilidade"}</span>
                      <div className="flex gap-1 flex-wrap items-center">
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {form.watch(`abilities.${index}.level`)}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {attributesList.find((a) => a.key === form.watch(`abilities.${index}.associatedAttribute`))?.label || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                    <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        className={hasAttribute ? "h-7 w-7 text-primary" : "h-7 w-7 text-muted-foreground"}
                        onClick={() => handleRollClick(index)}
                    >
                      {hasAttribute ? <Dices className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive opacity-50 hover:opacity-100"
                      onClick={() => removeAbility(index)}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="border-t pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                      <FormField control={form.control} name={`abilities.${index}.name`} render={({ field }) => (
                          <div className="space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                      )}/>
                      <FormField control={form.control} name={`abilities.${index}.level`} render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px]">Nível</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Novato">Novato</SelectItem><SelectItem value="Adepto">Adepto</SelectItem><SelectItem value="Mestre">Mestre</SelectItem></SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                       <FormField control={form.control} name={`abilities.${index}.type`} render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px]">Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                      <FormField control={form.control} name={`abilities.${index}.associatedAttribute`} render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-[10px]">Atributo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                              <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Nenhum">Nenhum</SelectItem><Separator />
                                {attributesList.map((attr) => (<SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <FormField control={form.control} name={`abilities.${index}.corruptionCost`} render={({ field }) => (
                          <div className="space-y-1"><FormLabel className="text-[10px]">Corrupção</FormLabel><Input placeholder="Ex: 1d4" {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                        )}/>
                  </div>
                  <FormField control={form.control} name={`abilities.${index}.description`} render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px]">Descrição</FormLabel><FormControl><Textarea placeholder="Efeitos..." {...field} className="min-h-[60px] text-xs" readOnly={isReadOnly}/></FormControl></FormItem>
                  )}/>
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* --- DIÁLOGOS E MODAIS --- */}
      
      {/* Seletor de Habilidades */}
      <ItemSelectorDialog
        open={isAbilityDbOpen}
        onOpenChange={setIsAbilityDbOpen}
        onSelect={handleAddAbilityFromDb}
        category="ability" 
        title="Selecionar Habilidade"
        tableId={npc.table_id} // CORREÇÃO: Usando npc.table_id
      />

      {/* Seletor de Traços */}
      <ItemSelectorDialog
        open={isTraitDbOpen}
        onOpenChange={setIsTraitDbOpen}
        onSelect={handleAddTraitFromDb}
        category="trait" 
        title="Selecionar Traço ou Dádiva"
        tableId={npc.table_id} // CORREÇÃO: Usando npc.table_id
      />

      {/* Rolagem de Dados */}
      {selectedAbilityRoll && (
        <NpcAbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => !open && setSelectedAbilityRoll(null)}
          {...selectedAbilityRoll}
          attributeName={selectedAbilityRoll.attributeName}
        />
      )}
    </div>
  );
};