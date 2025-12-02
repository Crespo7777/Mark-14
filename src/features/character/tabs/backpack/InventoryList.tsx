import { useState } from "react";
import { useCharacterSheet } from "../../CharacterSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { 
  Package, Plus, Trash2, Sword, Shield, Backpack, Database
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
import { EditItemDialog } from "./EditItemDialog"; // IMPORTANTE: Importar o Dialog de Edição

const INVENTORY_CATEGORIES_SELECTOR = [
  'general', 'consumable', 'container', 'ammunition', 'tool', 'spec_tool', 
  'clothing', 'food', 'mount', 'animal', 'construction', 'trap', 'artifact', 
  'musical', 'asset', 'material', 'weapon', 'armor'
];

export const InventoryList = () => {
  const { form, character, isReadOnly, saveSheet } = useCharacterSheet();
  const { toast } = useToast();
  const { equipItem } = useEquipmentManager();
  
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const { fields, append, remove, update } = useFieldArray({ 
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
        description: itemTemplate ? itemTemplate.description : "",
        icon_url: itemTemplate ? itemTemplate.icon_url : null // Importar ícone do banco
    };
    
    append(newItem);
    
    if (itemTemplate) {
        toast({ title: "Item Adicionado", description: `${newItem.name} na mochila.` });
    } else {
        toast({ title: "Item Criado", description: "Edite os detalhes abaixo." });
        // Abre o editor imediatamente para itens manuais (opcional, mas boa UX)
        setTimeout(() => setEditingItemIndex(fields.length), 100); 
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

  const handleSaveEdit = (updatedItem: any) => {
      if (editingItemIndex !== null) {
          update(editingItemIndex, updatedItem);
          saveSheet(); // Salvar a ficha após edição
          setEditingItemIndex(null);
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
                            const item = form.getValues(`inventory.${index}`); // Ler valor atual
                            const cat = item.category;
                            const isEquippable = cat === 'weapon' || cat === 'armor';
                            const iconUrl = item.icon_url;

                            return (
                                <AccordionItem key={field.id} value={field.id} className="border rounded-md bg-card px-2">
                                    
                                    {/* CABEÇALHO DO ITEM */}
                                    <div className="flex items-center justify-between py-2">
                                        <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                            <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                                                
                                                {/* ÍCONE (Imagem Customizada ou Padrão) */}
                                                <div 
                                                    className="w-10 h-10 rounded-md shrink-0 border border-border/50 overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isReadOnly) setEditingItemIndex(index);
                                                    }}
                                                    title="Clique para editar detalhes e ícone"
                                                >
                                                    {iconUrl ? (
                                                        <img src={iconUrl} alt="Item" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-muted-foreground">
                                                            {cat === 'weapon' ? <Sword className="w-5 h-5"/> : 
                                                             cat === 'armor' ? <Shield className="w-5 h-5"/> : 
                                                             <Package className="w-5 h-5"/>}
                                                        </div>
                                                    )}
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

                                        {/* AÇÕES */}
                                        <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                                            
                                            {/* Quantidade */}
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

                                    {/* CONTEÚDO EXPANDIDO (Edição rápida inline também mantida) */}
                                    <AccordionContent className="border-t pt-3 pb-3">
                                        <div className="space-y-3 px-1">
                                            {/* Nota: Deixei os inputs inline caso o usuário queira editar rápido sem abrir o modal, 
                                                mas o modal (clique no ícone) agora é o método principal para coisas complexas como ícones. */}
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-6">
                                                    <FormField control={form.control} name={`inventory.${index}.name`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px]">Nome</FormLabel><FormControl><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormControl></FormItem>
                                                    )}/>
                                                </div>
                                                <div className="col-span-3">
                                                    <FormField control={form.control} name={`inventory.${index}.weight`} render={({field}) => (
                                                        <FormItem className="space-y-0"><FormLabel className="text-[10px]">Peso</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-7 text-xs text-center" onChange={e => field.onChange(e.target.valueAsNumber)} readOnly={isReadOnly}/></FormControl></FormItem>
                                                    )}/>
                                                </div>
                                                <div className="col-span-3">
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="w-full h-[54px] mt-[1px] text-xs flex flex-col gap-1"
                                                        onClick={() => setEditingItemIndex(index)}
                                                    >
                                                        <span>Editar</span>
                                                        <span className="text-[9px] opacity-70">Detalhes</span>
                                                    </Button>
                                                </div>
                                            </div>

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

        {/* DIÁLOGO DE EDIÇÃO COMPLETA */}
        {editingItemIndex !== null && (
            <EditItemDialog
                open={true}
                onClose={() => setEditingItemIndex(null)}
                item={form.getValues(`inventory.${editingItemIndex}`)}
                onSave={handleSaveEdit}
                tableId={character.table_id}
            />
        )}
    </Card>
  );
};