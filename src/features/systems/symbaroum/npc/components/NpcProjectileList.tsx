import { useState } from "react";
import { useFieldArray, Control, useWatch } from "react-hook-form";
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
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
import { QualityInfoButton } from "@/features/systems/symbaroum/components/QualityInfoButton";
import { useToast } from "@/hooks/use-toast";
import { getDefaultProjectile } from "@/features/systems/symbaroum/utils/symbaroum.schema"; 

interface NpcProjectileListProps {
  control: Control<any>; 
  tableId: string;
}

export const NpcProjectileList = ({ control, tableId }: NpcProjectileListProps) => {
  const { toast } = useToast();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "projectiles", 
  });

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

  const ProjectileHeader = ({ index }: { index: number }) => {
      const name = useWatch({ control, name: `projectiles.${index}.name` });
      const quantity = useWatch({ control, name: `projectiles.${index}.quantity` });
      const attackMod = useWatch({ control, name: `projectiles.${index}.attack_modifier` });

      return (
        <div className="flex-1 flex items-center gap-2 text-left min-w-0">
            <h4 className="font-semibold text-sm truncate max-w-[120px]">{name || "Novo Projétil"}</h4>
            <div className="flex gap-1 shrink-0">
                <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background">Qtd: {quantity}</Badge>
                {attackMod && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200">
                        Atq: {attackMod}
                    </Badge>
                )}
            </div>
        </div>
      );
  };

  return (
    <Card className="border-t-4 border-t-blue-500 shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/10 border-b px-4 py-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-600">
          <CircleDot className="w-4 h-4" /> Munição & Projéteis
        </CardTitle>
        
        <div className="flex gap-2">
            <ItemSelectorDialog
                tableId={tableId}
                categories={['ammunition']}
                title="Buscar Munição"
                onSelect={handleAddFromDatabase}
            >
                <Button size="sm" variant="ghost" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                    <Database className="w-4 h-4" /> <span className="hidden sm:inline">Banco</span>
                </Button>
            </ItemSelectorDialog>
            <Button size="sm" variant="ghost" onClick={handleAddManual} title="Adicionar Manualmente" className="h-8 w-8 p-0">
                <Plus className="w-4 h-4" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        {fields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md bg-muted/10">
                <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Nenhuma munição equipada.</p>
            </div>
        )}

        <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
        {fields.map((field, index) => (
          <AccordionItem key={field.id} value={field.id} className="border rounded-md px-2 bg-card">
              <div className="flex justify-between items-center w-full gap-2 py-2">
                <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <ProjectileHeader index={index} />
                </AccordionTrigger>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 rounded-full"
                    onClick={(e) => { e.stopPropagation(); remove(index); }}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>

             <AccordionContent className="pt-2 pb-4 border-t border-border/50">
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2">
                        <FormField control={control} name={`projectiles.${index}.name`} render={({ field }) => (
                            <div className="col-span-8 space-y-1">
                                <FormLabel className="text-[10px]">Nome</FormLabel>
                                <FormControl><Input {...field} className="h-7 text-xs" /></FormControl>
                            </div>
                        )}/>
                        <FormField control={control} name={`projectiles.${index}.quantity`} render={({ field }) => (
                            <div className="col-span-4 space-y-1">
                                <FormLabel className="text-[10px]">Qtd.</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-7 text-xs text-center font-bold" /></FormControl>
                            </div>
                        )}/>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <FormField control={control} name={`projectiles.${index}.damage`} render={({ field }) => (
                            <div className="space-y-1">
                                <FormLabel className="text-[10px]">Dano Extra</FormLabel>
                                <FormControl><Input {...field} className="h-7 text-xs" /></FormControl>
                            </div>
                        )}/>

                        <FormField control={control} name={`projectiles.${index}.attack_modifier`} render={({ field }) => (
                            <div className="space-y-1">
                                <FormLabel className="text-[10px] text-blue-600">Bônus Atq</FormLabel>
                                <FormControl><Input {...field} className="h-7 text-xs border-blue-200 focus:border-blue-500" /></FormControl>
                            </div>
                        )}/>

                         <FormField control={control} name={`projectiles.${index}.weight`} render={({ field }) => (
                            <div className="space-y-1">
                                <FormLabel className="text-[10px]">Peso</FormLabel>
                                <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-7 text-xs" /></FormControl>
                            </div>
                        )}/>
                    </div>

                    <FormField control={control} name={`projectiles.${index}.quality`} render={({ field }) => (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-[10px]">Qualidades</FormLabel>
                                <QualityInfoButton qualitiesString={field.value} tableId={tableId}/>
                            </div>
                            <FormControl>
                                <QualitySelector 
                                    tableId={tableId} 
                                    value={field.value} 
                                    onChange={(val, desc) => { 
                                        field.onChange(val); 
                                    }} 
                                    targetType="weapon" 
                                />
                            </FormControl>
                        </div>
                    )}/>

                    <FormField control={control} name={`projectiles.${index}.description`} render={({ field }) => (
                        <div className="space-y-1">
                            <FormLabel className="text-[10px]">Descrição</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="min-h-[60px] text-xs bg-muted/20 resize-none" />
                            </FormControl>
                        </div>
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