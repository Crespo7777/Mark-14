import { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTableContext } from "@/features/table/TableContext"; 
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog"; // Genérico
import { RichTextEditor } from "@/components/RichTextEditor"; // Genérico
import { JournalRenderer } from "@/components/JournalRenderer"; // Genérico

// IMPORT LOCAL
import { getDefaultTrait } from "../utils/symbaroum.schema";

const TraitItem = ({ index, fieldId, control, name, remove, isReadOnly }: any) => {
  const traitName = useWatch({ control, name: `${name}.${index}.name` });
  const traitType = useWatch({ control, name: `${name}.${index}.type` });
  const traitLevel = useWatch({ control, name: `${name}.${index}.level` });

  return (
    <AccordionItem value={fieldId} className="p-3 rounded-md border bg-muted/20">
      <div className="flex justify-between items-center w-full p-0">
        <AccordionTrigger className="p-0 hover:no-underline flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
            <h4 className="font-semibold text-base text-primary-foreground truncate max-w-[200px]">{traitName || "Novo Traço"}</h4>
            <div className="flex items-center gap-2 text-sm">
                {traitType && <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase tracking-wide font-bold h-5">{traitType}</Badge>}
                {traitLevel && traitLevel !== "" && traitLevel !== "none" && (
                    <span className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><span className="w-1 h-1 rounded-full bg-muted-foreground/40" />{traitLevel}</span>
                )}
            </div>
          </div>
        </AccordionTrigger>
        {!isReadOnly && (
            <div className="flex pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
            </div>
        )}
      </div>
      <AccordionContent className="pt-4 mt-3 border-t border-border/50">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={control} name={`${name}.${index}.name`} render={({ field }) => (
                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do Traço" {...field} readOnly={isReadOnly} /></FormControl></FormItem>
            )} />
            <FormField control={control} name={`${name}.${index}.type`} render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Traço">Traço</SelectItem><SelectItem value="Dádiva">Dádiva</SelectItem><SelectItem value="Fardo">Fardo</SelectItem><SelectItem value="Monstruoso">Monstruoso</SelectItem></SelectContent></Select></FormItem>
            )} />
            <FormField control={control} name={`${name}.${index}.level`} render={({ field }) => (
                <FormItem><FormLabel>Nível (Opcional)</FormLabel><Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"} disabled={isReadOnly}><FormControl><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">-</SelectItem><SelectItem value="Novato">Novato</SelectItem><SelectItem value="Adepto">Adepto</SelectItem><SelectItem value="Mestre">Mestre</SelectItem></SelectContent></Select></FormItem>
            )} />
          </div>
          <FormField control={control} name={`${name}.${index}.description`} render={({ field }) => (
              <FormItem><FormLabel>Descrição (Regras)</FormLabel><FormControl>{isReadOnly ? <div className="p-3 border rounded-md bg-background/50 min-h-[80px]"><JournalRenderer content={field.value} /></div> : <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Descreva o traço..." />}</FormControl></FormItem>
            )} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface SharedTraitListProps { control: Control<any>; name: string; isReadOnly?: boolean; }

export const SharedTraitList = ({ control, name, isReadOnly = false }: SharedTraitListProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({ control, name });
  const { tableId } = useTableContext();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles /> Traços, Dádivas & Fardos</CardTitle>
        {!isReadOnly && (
            <ItemSelectorDialog tableId={tableId} categories={['trait']} title="Adicionar Traço" onSelect={(template) => {
                if (template) {
                    let desc = "";
                    if (template.description && template.description !== "<p></p>") desc += template.description;
                    if (template.data.novice || template.data.adept || template.data.master) {
                        desc += `<hr/><p><strong>NÍVEIS:</strong></p><ul>`;
                        if (template.data.novice) desc += `<li><strong>I (Novato):</strong> ${template.data.novice}</li>`;
                        if (template.data.adept) desc += `<li><strong>II (Adepto):</strong> ${template.data.adept}</li>`;
                        if (template.data.master) desc += `<li><strong>III (Mestre):</strong> ${template.data.master}</li>`;
                        desc += `</ul>`;
                    }
                    if (template.data.cost) desc += `<p><em>Custo: ${template.data.cost}</em></p>`;

                    append({
                        ...getDefaultTrait(),
                        name: template.name,
                        type: template.data.type || "Traço",
                        description: desc,
                        level: "" 
                    });
                } else {
                    append(getDefaultTrait());
                }
            }}>
                <Button type="button" size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </ItemSelectorDialog>
        )}
      </CardHeader>
      <CardContent>
        {fields.length === 0 && <p className="text-muted-foreground text-center py-12">Nenhum traço, dádiva ou fardo adicionado.</p>}
        <Accordion type="multiple" className="space-y-4" value={openItems} onValueChange={setOpenItems}>
          {fields.map((field, index) => {
            // @ts-ignore
            const stableId = field.id; 
            return <TraitItem key={stableId} fieldId={stableId} index={index} control={control} name={name} remove={remove} isReadOnly={isReadOnly} />;
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};