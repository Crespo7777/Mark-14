import { useState } from "react";
import { useCharacterSheet } from "../../CharacterSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { 
  Package, Plus, Trash2, Sword, Shield, Backpack, Database, 
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEquipmentManager } from "../../hooks/useEquipmentManager";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attributesList } from "../../character.constants";
import { QualitySelector } from "@/components/QualitySelector";
import { QualityInfoButton } from "@/components/QualityInfoButton";

const INVENTORY_CATEGORIES_SELECTOR = [
  'general', 'consumable', 'container', 'ammunition', 'tool', 'spec_tool', 
  'clothing', 'food', 'mount', 'animal', 'construction', 'trap', 'artifact', 
  'musical', 'asset', 'material', 'weapon', 'armor'
];

export const InventoryList = () => {
  const { form, character, isReadOnly } = useCharacterSheet();
  const { toast } = useToast();
  const { equipItem } = useEquipmentManager();
  
  const [openItems, setOpenItems] = useState<string[]>([]);

  // useFieldArray para gestão direta da lista
  const { fields, append, remove } = useFieldArray({ 
      control: form.control, 
      name: "inventory" 
  });

  const handleAddItem = (itemTemplate: any) => {
    const newItem = {
        id: crypto.randomUUID(),
        name: itemTemplate ? itemTemplate.name : "Novo Item",
        category: itemTemplate ? itemTemplate.category : "general",
        weight: itemTemplate ? (Number(itemTemplate.weight) || 0) : 0,
        quantity: 1,
        data: itemTemplate ? (itemTemplate.data || {}) : {},
        description: itemTemplate ? itemTemplate.description : ""
    };
    
    append(newItem);
    
    if (itemTemplate) {
        toast({ title: "Item Adicionado", description: `${newItem.name} na mochila.` });
    } else {
        toast({ title: "Item Criado", description: "Edite os detalhes abaixo." });
        setTimeout(() => setOpenItems(prev => [...prev, newItem.id]), 100);
    }
  };

  const handleAddManual = () => handleAddItem(null);

  const handleEquipClick = (index: number) => {
      const item = form.getValues(`inventory.${index}`);
      const category = item.category || item.data?.category;
      
      if (category === 'weapon') equipItem(index, 'weapon');
      else if (category === 'armor') equipItem(index, 'armor');
      else {
          toast({ title: "Ação Inválida", description: "Apenas armas e armaduras podem ser equipadas.", variant: "destructive" });
      }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
        weapon: 'Arma', armor: 'Armadura', general: 'Geral', consumable: 'Elixir',
        food: 'Comida', tool: 'Ferramenta', clothing: 'Roupa', musical: 'Instrumento',
        asset: 'Provento', animal: 'Animal', mount: 'Montaria', ammunition: 'Munição',
        material: 'Material', artifact: 'Artefato'
    };
    return map[cat] || cat;
  };

  return (
    <Card className="flex-1 flex flex-col border-t-4 border-t-primary shadow-sm min-h-[500px]">
        <CardHeader className="py-2 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
                <Backpack className="w-4 h-4 text-primary" /> Inventário Geral
            </CardTitle>
            
            {!isReadOnly && (
                <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={handleAddManual} className="h-7 text-xs gap-1 shadow-sm">
                        <Plus className="w-3 h-3" /> Criar Item
                    </Button>
                    <ItemSelectorDialog tableId={character.table_id} categories={INVENTORY_CATEGORIES_SELECTOR} title="Buscar no Compêndio" onSelect={handleAddItem}>
                        <Button size="sm" variant="outline" className="border-dashed gap-2 h-7 text-xs">
                            <Database className="w-3 h-3" /> Buscar
                        </Button>
                    </ItemSelectorDialog>
                </div>
            )}
        </CardHeader>
        
        <CardContent className="p-0 flex-1 bg-card">
            <ScrollArea className="h-[500px] px-2 py-2">
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                        <Package className="w-10 h-10 mb-2 stroke-1" />
                        <p className="text-sm">Mochila vazia.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
                        {fields.map((field, index) => {
                            // Leitura direta dos dados para renderização
                            // Como não há filtros, o index do map é o index real!
                            const cat = form.watch(`inventory.${index}.category`);
                            const isEquippable = cat === 'weapon' || cat === 'armor';
                            const fieldId = field.id;

                            return (
                                <AccordionItem key={fieldId} value={fieldId} className="border rounded-md bg-card px-2">
                                    
                                    {/* CABEÇALHO DO ITEM */}
                                    <div className="flex items-center justify-between py-2">
                                        <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                            <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                                                {/* Ícone por Categoria */}
                                                <div className="bg-muted w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-border/50 text-muted-foreground">
                                                    {cat === 'weapon' ? <Sword className="w-4 h-4"/> : 
                                                     cat === 'armor' ? <Shield className="w-4 h-4"/> : 
                                                     <Package className="w-4 h-4"/>}
                                                </div>
                                                
                                                {/* Nome e Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm truncate text-foreground/90">
                                                        {form.watch(`inventory.${index}.name`)}
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                                                        <span className="capitalize">{getCategoryLabel(cat)}</span>
                                                        <span>•</span>
                                                        <span>Peso: {Number(form.watch(`inventory.${index}.weight`) || 0).toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        {/* AÇÕES (Qtd, Equipar, Apagar) */}
                                        <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                                            
                                            {/* Input de Quantidade */}
                                            <div className="flex items-center bg-muted/30 rounded border border-border/50 px-1 h-7">
                                                <span className="text-[10px] text-muted-foreground mr-1">Qtd</span>
                                                <FormField control={form.control} name={`inventory.${index}.quantity`} render={({field}) => (
                                                    <input 
                                                        type="number" 
                                                        className="w-8 bg-transparent text-center text-xs font-bold focus:outline-none appearance-none" 
                                                        {...field}
                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                        readOnly={isReadOnly}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                )}/>
                                            </div>

                                            {!isReadOnly && isEquippable && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); handleEquipClick(index); }} title="Equipar">
                                                    {cat === 'armor' ? <Shield className="w-3 h-3"/> : <Sword className="w-3 h-3"/>}
                                                </Button>
                                            )}

                                            {!isReadOnly && (
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-red-600" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(confirm("Apagar este item?")) remove(index);
                                                    }} 
                                                    title="Apagar Item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONTEÚDO EXPANDIDO */}
                                    <AccordionContent className="border-t pt-3 pb-3">
                                        <div className="space-y-3 px-1">
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-6">
                                                    <FormField control={form.control} name={`inventory.${index}.name`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px]">Nome</FormLabel><FormControl><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormControl></FormItem>
                                                    )}/>
                                                </div>
                                                <div className="col-span-3">
                                                    <FormField control={form.control} name={`inventory.${index}.weight`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px]">Peso Total</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-7 text-xs text-center" onChange={e => field.onChange(e.target.valueAsNumber)} readOnly={isReadOnly}/></FormControl></FormItem>
                                                    )}/>
                                                </div>
                                                <div className="col-span-3">
                                                    <FormField control={form.control} name={`inventory.${index}.category`} render={({field}) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="text-[10px]">Categoria</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                                                <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    {INVENTORY_CATEGORIES_SELECTOR.map(c => (<SelectItem key={c} value={c} className="text-xs capitalize">{getCategoryLabel(c)}</SelectItem>))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}/>
                                                </div>
                                            </div>

                                            {/* Campos Específicos */}
                                            {cat === 'weapon' && (
                                                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded border border-border/50">
                                                    <FormField control={form.control} name={`inventory.${index}.data.damage`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px] text-red-500">Dano</FormLabel><FormControl><Input {...field} className="h-7 text-xs" placeholder="Ex: 1d8"/></FormControl></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name={`inventory.${index}.data.attackAttribute`} render={({field}) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="text-[10px]">Atributo</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                                                <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="-"/></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    {attributesList.map(a => <SelectItem key={a.key} value={a.key} className="text-xs">{a.label}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}/>
                                                </div>
                                            )}

                                            {cat === 'armor' && (
                                                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded border border-border/50">
                                                    <FormField control={form.control} name={`inventory.${index}.data.protection`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px] text-blue-500">Proteção</FormLabel><FormControl><Input {...field} className="h-7 text-xs" placeholder="Ex: 1d4"/></FormControl></FormItem>
                                                    )}/>
                                                    <FormField control={form.control} name={`inventory.${index}.data.obstructive`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px]">Penalidade</FormLabel><FormControl><Input type="number" {...field} className="h-7 text-xs" placeholder="0"/></FormControl></FormItem>
                                                    )}/>
                                                </div>
                                            )}

                                            {(cat === 'weapon' || cat === 'armor' || cat === 'artifact') && (
                                                <div className="bg-muted/20 p-2 rounded border border-border/50">
                                                    <FormField control={form.control} name={`inventory.${index}.data.quality`} render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <FormLabel className="text-[10px]">Qualidades</FormLabel>
                                                                <QualityInfoButton qualitiesString={field.value} tableId={character.table_id}/>
                                                            </div>
                                                            <FormControl>
                                                                <QualitySelector 
                                                                    tableId={character.table_id} 
                                                                    value={field.value} 
                                                                    onChange={field.onChange} 
                                                                    targetType={cat === 'armor' ? 'armor' : 'weapon'} 
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}/>
                                                </div>
                                            )}

                                            <FormField control={form.control} name={`inventory.${index}.description`} render={({field}) => (
                                                <FormItem className="space-y-0"><FormLabel className="text-[10px]">Descrição / Efeitos</FormLabel><FormControl><Textarea {...field} className="min-h-[60px] text-xs resize-none bg-muted/20" placeholder="Detalhes do item..." readOnly={isReadOnly}/></FormControl></FormItem>
                                            )}/>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
};