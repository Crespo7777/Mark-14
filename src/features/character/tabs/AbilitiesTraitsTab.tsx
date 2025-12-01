import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, Dices, Scroll, BookOpen, Settings2 } from "lucide-react";
import { getDefaultAbility } from "../character.schema";
import { attributesList } from "../character.constants";
import { AbilityRollDialog } from "@/components/AbilityRollDialog";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Adicionado para o visual novo
import { Label } from "@/components/ui/label"; // Adicionado para o visual novo
import { SharedTraitList } from "@/components/SharedTraitList";
import { useTableContext } from "@/features/table/TableContext";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { JournalRenderer } from "@/components/JournalRenderer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Sub-componente Visual para o Card de Habilidade (Com lógica original preservada)
const AbilityItemCard = ({ index, form, remove, isReadOnly, handleRoll }: any) => {
    const isActive = form.watch(`abilities.${index}.isActive`);
    const level = form.watch(`abilities.${index}.level`) || "Novato";
    const type = form.watch(`abilities.${index}.type`);
    const attrKey = form.watch(`abilities.${index}.associatedAttribute`);
    const hasAttr = attrKey && attrKey !== "Nenhum";

    // Cores visuais para os níveis (Foundry Style)
    const levelColor = { 
        "Novato": "bg-amber-600/80", 
        "Adepto": "bg-slate-500", 
        "Mestre": "bg-purple-600" 
    }[level as string] || "bg-slate-500";

    return (
        <AccordionItem key={index} value={`ability-${index}`} className="border rounded-lg bg-card mb-2 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-1 pr-2 bg-muted/10">
                <AccordionTrigger className="hover:no-underline px-3 py-2 flex-1">
                    <div className="flex flex-col items-start gap-1 text-left">
                        <div className="flex items-center gap-2">
                            {/* Ícone muda de cor se ativo */}
                            <Zap className={cn("w-4 h-4 transition-colors", isActive ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                            <span className="font-bold text-sm text-foreground">{form.watch(`abilities.${index}.name`) || "Nova Habilidade"}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <Badge variant="secondary" className={cn("text-[10px] h-4 px-1.5 text-white border-none shadow-sm", levelColor)}>
                                {level}
                            </Badge>
                            {type === "Ritual" && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-purple-500 text-purple-500"><Scroll className="w-3 h-3 mr-1"/> Ritual</Badge>}
                        </div>
                    </div>
                </AccordionTrigger>
                
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {/* Switch de Ativo (Visual Moderno) */}
                    <FormField control={form.control} name={`abilities.${index}.isActive`} render={({field}) => (
                        <div className="flex items-center gap-2 mr-2">
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} className="scale-75 data-[state=checked]:bg-yellow-500" />
                        </div>
                    )}/>
                    
                    {/* Botão de Rolar (Se tiver atributo) */}
                    <Button 
                        size="sm" 
                        variant={hasAttr ? "default" : "secondary"} 
                        className="h-7 text-xs px-2 shadow-sm" 
                        onClick={() => handleRoll(index)}
                        disabled={!hasAttr && type !== "Ritual"} // Rituais podem não ter rolagem
                    >
                        {hasAttr ? <><Dices className="w-3 h-3 mr-1"/> Testar</> : <><Settings2 className="w-3 h-3 mr-1"/> Usar</>}
                    </Button>

                    {!isReadOnly && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <AccordionContent className="px-4 pb-4 pt-0 border-t bg-background">
                {/* Campos de Edição (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField control={form.control} name={`abilities.${index}.name`} render={({field}) => (
                        <FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input {...field} className="h-8" readOnly={isReadOnly}/></FormControl></FormItem>
                    )} />
                    
                    <FormField control={form.control} name={`abilities.${index}.level`} render={({field}) => (
                        <FormItem><FormLabel className="text-xs">Nível</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Novato">Novato</SelectItem>
                                    <SelectItem value="Adepto">Adepto</SelectItem>
                                    <SelectItem value="Mestre">Mestre</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    <FormField control={form.control} name={`abilities.${index}.type`} render={({field}) => (
                        <FormItem><FormLabel className="text-xs">Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Habilidade">Habilidade</SelectItem>
                                    <SelectItem value="Poder">Poder</SelectItem>
                                    <SelectItem value="Ritual">Ritual</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <FormField control={form.control} name={`abilities.${index}.associatedAttribute`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Atributo Associado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Nenhum">Nenhum</SelectItem>
                                    <Separator />
                                    {attributesList.map((attr) => (<SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    
                    <FormField control={form.control} name={`abilities.${index}.corruptionCost`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-purple-500">Custo Corrupção</FormLabel>
                            <FormControl><Input placeholder="Ex: 1d4" {...field} className="h-8 border-purple-200 focus:border-purple-500" readOnly={isReadOnly} /></FormControl>
                        </FormItem>
                    )} />
                </div>

                {type === "Ritual" && (
                    <div className="mt-2">
                        <FormField control={form.control} name={`abilities.${index}.tradition`} render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1"><BookOpen className="w-3 h-3"/> Tradição</FormLabel>
                                <FormControl><Input placeholder="Ex: Feitiçaria" {...field} className="h-8" readOnly={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                )}

                {/* Editor de Texto Rico (Restaurado) */}
                <div className="mt-4">
                    <Label className="text-xs text-muted-foreground mb-1 block">Descrição e Regras</Label>
                    <FormField control={form.control} name={`abilities.${index}.description`} render={({field}) => (
                        <div className="min-h-[100px] border rounded-md bg-muted/5">
                            {isReadOnly ? (
                                <div className="p-3 text-sm"><JournalRenderer content={field.value} /></div>
                            ) : (
                                <RichTextEditor 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    placeholder="Descreva os efeitos..." 
                                    className="min-h-[100px] border-none shadow-none" 
                                />
                            )}
                        </div>
                    )} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export const AbilitiesTraitsTab = () => {
  const { form, isReadOnly } = useCharacterSheet();
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<AbilityRollData | null>(null);
  const [openAbilityItems, setOpenAbilityItems] = useState<string[]>([]);
  const { getValues, setValue } = useFormContext();
  const { tableId } = useTableContext();
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
      ? (typeof allAttributes[selectedAttr.key] === 'object' ? allAttributes[selectedAttr.key].value : allAttributes[selectedAttr.key]) || 0
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: Number(attributeValue),
      corruptionCost: String(ability.corruptionCost || "0"),
    });
  };

  const handleApplyCorruption = (amount: number) => {
      if (amount > 0) {
          const currentTemp = Number(getValues("corruption.temporary")) || 0;
          setValue("corruption.temporary", currentTemp + amount, { shouldDirty: true });
          toast({
              title: "Corrupção Aplicada",
              description: `+${amount} de corrupção temporária adicionada.`,
              variant: "destructive"
          });
      }
  };

  const characterName = form.watch("name");

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. COMPONENTE DE TRAÇOS (Restaurado: Usa o componente original) */}
      <SharedTraitList control={form.control} name="traits" isReadOnly={isReadOnly} />

      {/* 2. CARD DE HABILIDADES (Visual Foundry) */}
      <Card className="border-t-4 border-t-yellow-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="text-yellow-600 w-5 h-5" /> Habilidades, Poderes & Rituais
          </CardTitle>
          
          {!isReadOnly && (
            <ItemSelectorDialog 
                tableId={tableId} 
                categories={['ability']} 
                title="Adicionar Habilidade"
                onSelect={(template) => {
                    if (template) {
                        // LÓGICA ORIGINAL DE IMPORTAÇÃO (Restaurada)
                        let desc = "";
                        if(template.description && template.description !== "<p></p>") {
                             desc += template.description;
                        }
                        
                        desc += `<hr/><p><strong>EFEITOS:</strong></p><ul>`;
                        if (template.data.novice) desc += `<li><strong>Novato:</strong> ${template.data.novice}</li>`;
                        if (template.data.adept)  desc += `<li><strong>Adepto:</strong> ${template.data.adept}</li>`;
                        if (template.data.master) desc += `<li><strong>Mestre:</strong> ${template.data.master}</li>`;
                        desc += `</ul>`;
                        
                        appendAbility({
                            ...getDefaultAbility(),
                            name: template.name,
                            level: template.data.level || "Novato", 
                            type: template.data.type || "Habilidade",
                            description: desc, 
                            corruptionCost: template.data.corruptionCost || "0",
                            associatedAttribute: template.data.associatedAttribute || "Nenhum",
                            tradition: template.data.tradition || ""
                        });
                    } else {
                        appendAbility(getDefaultAbility());
                    }
                }}
            >
                <Button type="button" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Adicionar
                </Button>
            </ItemSelectorDialog>
          )}
        </CardHeader>
        
        <CardContent className="p-2 md:p-4 bg-muted/5 min-h-[300px]">
          {abilityFields.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-50">
              <Zap className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma habilidade aprendida.</p>
            </div>
          )}

          <Accordion
            type="multiple"
            className="space-y-2"
            value={openAbilityItems}
            onValueChange={setOpenAbilityItems}
          >
            {abilityFields.map((field, index) => (
                <AbilityItemCard 
                    key={field.id} 
                    index={index} 
                    form={form} 
                    remove={removeAbility} 
                    isReadOnly={isReadOnly} 
                    handleRoll={handleRollClick}
                />
            ))}
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
          onApplyCorruption={handleApplyCorruption} 
        />
      )}
    </div>
  );
};