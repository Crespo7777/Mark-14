import { useState } from "react";
import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext"; // <--- NOVO CONTEXTO
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Backpack, Plus, Database, PenTool, Package, Weight, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";

// IMPORTANTE: Use o SharedProjectileList que criámos/corrigimos em src/components
import { SharedProjectileList } from "@/components/SharedProjectileList"; 

const ALLOWED_CATEGORIES = [
    "general", "consumable", "container", "tool", "clothing", 
    "food", "material", "valuable", "artifact", "musical", "trap", "asset"
];

export const NpcInventoryTab = () => {
    const { form, npc, isReadOnly } = useSymbaroumNpcSheet();
    const { toast } = useToast();
    
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [isDbOpen, setIsDbOpen] = useState(false);

    const { fields, append, remove } = useFieldArray({ 
        control: form.control, 
        name: "inventory" 
    });

    const handleAddFromDb = (item: any) => {
        const data = item.data || {};
        append({
            name: item.name,
            description: item.description || "",
            amount: 1,
            weight: parseFloat(item.weight) || 0,
            price: data.price || ""
        });
        toast({ title: "Item Adicionado", description: item.name });
        setIsDbOpen(false);
    };

    const handleManualAdd = () => {
        append({
            name: "Novo Item",
            description: "",
            amount: 1,
            weight: 0,
            price: ""
        });
    };

    const totalWeight = fields.reduce((acc, item, idx) => {
        const w = parseFloat(form.watch(`inventory.${idx}.weight`) || "0");
        const q = parseFloat(form.watch(`inventory.${idx}.amount`) || "0");
        return acc + (w * q);
    }, 0);

    return (
        <div className="space-y-6 pb-10 h-full flex flex-col">
            
            {/* 1. MUNIÇÕES */}
            <div className="shrink-0">
                <SharedProjectileList 
                    tableId={npc.table_id} 
                    control={form.control} 
                    name="projectiles" // Certifica-te que o schema tem este campo
                />
            </div>

            {/* 2. INVENTÁRIO GERAL */}
            <Card className="flex flex-col border-t-4 border-t-emerald-600 shadow-sm flex-1">
                <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                            <Backpack className="w-4 h-4" /> Espólios & Equipamento
                        </CardTitle>
                        
                        {totalWeight > 0 && (
                            <Badge variant="secondary" className="text-xs font-normal bg-background/80 border-emerald-200 text-emerald-700">
                                <Weight className="w-3 h-3 mr-1" /> {totalWeight.toFixed(1)} kg
                            </Badge>
                        )}
                    </div>
                    
                    {!isReadOnly && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                                    <Plus className="w-4 h-4" /> Adicionar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsDbOpen(true)}>
                                    <Database className="w-4 h-4 mr-2" /> Buscar no Banco
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleManualAdd}>
                                    <PenTool className="w-4 h-4 mr-2" /> Criar Manualmente
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
                
                <CardContent className="p-2 flex-1 overflow-y-auto">
                    {fields.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg m-2 bg-muted/5">
                            <Package className="w-10 h-10 mb-2 opacity-20" />
                            <span className="text-sm">Mochila vazia.</span>
                        </div>
                    )}

                    <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
                        {fields.map((field, index) => (
                            <AccordionItem key={field.id} value={field.id} className="border rounded-md px-2 bg-card">
                                <div className="flex items-center justify-between w-full gap-2 py-2">
                                     <AccordionTrigger className="p-0 hover:no-underline flex-1 mr-2">
                                        <div className="flex flex-col items-start text-left gap-0.5 w-full">
                                            <div className="flex justify-between w-full pr-2">
                                                <span className="font-semibold text-sm">{form.watch(`inventory.${index}.name`) || "Item"}</span>
                                                <span className="text-xs font-mono text-muted-foreground">x{form.watch(`inventory.${index}.amount`)}</span>
                                            </div>
                                        </div>
                                     </AccordionTrigger>
                                     {!isReadOnly && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); remove(index); }}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                     )}
                                </div>

                                <AccordionContent className="border-t pt-2 pb-2">
                                    <div className="grid grid-cols-6 gap-2 mb-2">
                                        <FormField control={form.control} name={`inventory.${index}.name`} render={({ field }) => (
                                            <div className="col-span-4 space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                                        )}/>
                                        <FormField control={form.control} name={`inventory.${index}.amount`} render={({ field }) => (
                                            <div className="col-span-1 space-y-1"><FormLabel className="text-[10px]">Qtd</FormLabel><Input type="number" {...field} className="h-7 text-xs text-center" readOnly={isReadOnly} /></div>
                                        )}/>
                                        <FormField control={form.control} name={`inventory.${index}.weight`} render={({ field }) => (
                                            <div className="col-span-1 space-y-1"><FormLabel className="text-[10px]">Peso</FormLabel><Input type="number" step="0.1" {...field} className="h-7 text-xs text-center" readOnly={isReadOnly} /></div>
                                        )}/>
                                    </div>
                                    <FormField control={form.control} name={`inventory.${index}.description`} render={({ field }) => (
                                        <div className="space-y-1"><FormLabel className="text-[10px]">Descrição</FormLabel><Textarea {...field} className="min-h-[50px] text-xs resize-none bg-muted/20" readOnly={isReadOnly} /></div>
                                    )}/>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <ItemSelectorDialog
                open={isDbOpen}
                onOpenChange={setIsDbOpen}
                onSelect={handleAddFromDb}
                categories={ALLOWED_CATEGORIES}
                title="Adicionar à Mochila"
                tableId={npc.table_id}
            />
        </div>
    );
};