import { useState } from "react";
import { useFieldArray, useFormContext, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDot, Plus, Trash2, Database, Crosshair } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { QualitySelector } from "../../components/QualitySelector"; // Ajuste
import { QualityInfoButton } from "../../components/QualityInfoButton"; // Ajuste
import { useToast } from "@/hooks/use-toast";
// CORREÇÃO: Schema do sistema
import { getDefaultProjectile } from "../../utils/symbaroum.schema";

interface ProjectileListProps {
  control?: Control<any>; 
  tableId?: string;
}

export const ProjectileList = ({ control: propsControl, tableId }: ProjectileListProps) => {
  const formContext = useFormContext();
  const control = propsControl || formContext.control;
  const { setValue, watch } = formContext;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "projectiles",
  });
  const { toast } = useToast();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleAddManual = () => {
    append(getDefaultProjectile());
  };

  const handleAddFromDatabase = (itemTemplate: any) => {
    if (!itemTemplate) {
        handleAddManual();
        return;
    }
    
    append({
        ...getDefaultProjectile(),
        name: itemTemplate.name,
        quantity: 20, 
        damage: itemTemplate.data?.damage || "",
        attack_modifier: itemTemplate.data?.attack_modifier || "", 
        weight: Number(itemTemplate.weight) || 0,
        quality: itemTemplate.data?.quality || "",
        quality_desc: itemTemplate.data?.quality_desc || "",
        description: itemTemplate.description || "",
    });
    
    toast({ title: "Munição Adicionada", description: itemTemplate.name });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CircleDot className="w-5 h-5" /> Munição (Projéteis)
        </CardTitle>
        
        <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleAddManual} title="Adicionar Manualmente">
                <Plus className="w-4 h-4" />
            </Button>

            {tableId && (
                <ItemSelectorDialog
                    tableId={tableId}
                    categories={['ammunition']}
                    title="Buscar Munição"
                    onSelect={handleAddFromDatabase}
                >
                    <Button size="sm" variant="outline" className="gap-2 border-dashed">
                        <Database className="w-4 h-4" /> Banco de Dados
                    </Button>
                </ItemSelectorDialog>
            )}
        </div>
      </CardHeader>
      
      <CardContent>
        {fields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md bg-muted/10">
                <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma munição equipada.</p>
            </div>
        )}

        <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
        {fields.map((field, index) => (
          <AccordionItem key={field.id} value={field.id} className="border rounded-md px-2 bg-card">
             <div className="flex justify-between items-center w-full gap-2 py-2">
                <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex-1 flex items-center gap-2 text-left min-w-0">
                        <h4 className="font-semibold text-sm truncate">{watch(`projectiles.${index}.name`) || "Novo Projétil"}</h4>
                        <div className="flex gap-1 shrink-0">
                             <Badge variant="outline" className="text-[10px] h-5 px-1">Qtd: {watch(`projectiles.${index}.quantity`)}</Badge>
                             {watch(`projectiles.${index}.attack_modifier`) && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                    Atq: {watch(`projectiles.${index}.attack_modifier`)}
                                </Badge>
                             )}
                        </div>
                    </div>
                </AccordionTrigger>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => { e.stopPropagation(); remove(index); }}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>

             <AccordionContent className="pt-2 pb-4 border-t border-border/50">
                <div className="space-y-4">
                    <div className="flex gap-4 items-end">
                        <FormField control={control} name={`projectiles.${index}.name`} render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="text-xs">Nome</FormLabel>
                                <FormControl><Input {...field} className="h-8" placeholder="Ex: Flechas de Fogo" /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={control} name={`projectiles.${index}.quantity`} render={({ field }) => (
                            <FormItem className="w-20">
                                <FormLabel className="text-xs">Quantidade</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-8" /></FormControl>
                            </FormItem>
                        )}/>
                    </div>
                    
                    <div className="flex gap-4 items-end">
                         <FormField control={control} name={`projectiles.${index}.weight`} render={({ field }) => (
                            <FormItem className="w-24">
                                <FormLabel className="text-xs">Peso (Total)</FormLabel>
                                <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-8" /></FormControl>
                            </FormItem>
                        )}/>
                        
                        <FormField control={control} name={`projectiles.${index}.damage`} render={({ field }) => (
                            <FormItem className="w-24">
                                <FormLabel className="text-xs">Dano Extra</FormLabel>
                                <FormControl><Input {...field} placeholder="+0" className="h-8" title="Ex: +2, 1d4" /></FormControl>
                            </FormItem>
                        )}/>

                        <FormField control={control} name={`projectiles.${index}.attack_modifier`} render={({ field }) => (
                            <FormItem className="w-24">
                                <FormLabel className="text-xs">Bônus Atq</FormLabel>
                                <FormControl><Input {...field} placeholder="+0" className="h-8 border-blue-200 focus:border-blue-500" title="Ex: +1 para acertar" /></FormControl>
                            </FormItem>
                        )}/>
                    </div>

                    <FormField control={control} name={`projectiles.${index}.quality`} render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-xs">Qualidades</FormLabel>
                                <QualityInfoButton qualitiesString={field.value} tableId={tableId}/>
                            </div>
                            <FormControl>
                                <QualitySelector 
                                    tableId={tableId} 
                                    value={field.value} 
                                    onChange={(val, desc) => { 
                                        field.onChange(val); 
                                        if(desc) setValue(`projectiles.${index}.quality_desc`, desc, {shouldDirty:true}); 
                                    }} 
                                    targetType="weapon" 
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    <FormField control={control} name={`projectiles.${index}.description`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Descrição</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="min-h-[60px] text-xs bg-muted/20" placeholder="Detalhes, regras especiais..." />
                            </FormControl>
                        </FormItem>
                    )}/>
                </div>
             </AccordionContent>
          </AccordionItem>
        ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};