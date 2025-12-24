import { useState } from "react";
import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Backpack, Plus, Database, PenTool, Package, Weight, Trash2, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { cn } from "@/lib/utils";

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

    // CORREÇÃO DO BUG: Adicionada verificação de item nulo
    const handleAddFromDb = (item: any) => {
        if (!item) {
            handleManualAdd();
            setIsDbOpen(false);
            return;
        }

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
        <div className="space-y-4 pb-10 h-full flex flex-col px-1">
            
            <Card className="flex flex-col border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden flex-1 transition-all">
                {/* Acento Visual Esmeralda */}
                <div className="h-1.5 w-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />

                <CardHeader className="py-4 px-5 bg-black/20 border-b border-white/5 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-500">
                                <Backpack className="w-4 h-4" /> Inventário Geral
                            </CardTitle>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">Equipamento e Tesouros</span>
                        </div>
                        
                        {totalWeight > 0 && (
                            <Badge variant="outline" className="text-[10px] font-black bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                                <Weight className="w-3 h-3 mr-1.5" /> {totalWeight.toFixed(1)} KG
                            </Badge>
                        )}
                    </div>
                    
                    {!isReadOnly && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg px-4">
                                    <Plus className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border-border/60">
                                <DropdownMenuItem onClick={() => setIsDbOpen(true)} className="text-xs font-bold uppercase tracking-tight">
                                    <Database className="w-4 h-4 mr-2 text-emerald-500" /> Buscar no Grimório
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleManualAdd} className="text-xs font-bold uppercase tracking-tight">
                                    <PenTool className="w-4 h-4 mr-2 text-emerald-500" /> Entrada Manual
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
                
                <CardContent className="p-3 flex-1 overflow-y-auto">
                    {fields.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-white/5 rounded-xl m-2 bg-black/10">
                            <Package className="w-12 h-12 mb-3 opacity-10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Mochila Vazia</span>
                        </div>
                    )}

                    <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
                        {fields.map((field, index) => (
                            <AccordionItem key={field.id} value={field.id} className="border border-white/5 rounded-xl px-3 bg-black/20 hover:bg-black/30 transition-colors group overflow-hidden">
                                <div className="flex items-center justify-between w-full gap-2 py-1">
                                     <AccordionTrigger className="py-3 hover:no-underline flex-1 text-left">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                                                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>
                                                <span className="font-bold text-xs uppercase tracking-tight text-foreground/80 group-hover:text-foreground">
                                                    {form.watch(`inventory.${index}.name`) || "Item"}
                                                </span>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] font-mono font-black bg-black/40 text-emerald-400 border border-white/5">
                                                x{form.watch(`inventory.${index}.amount`)}
                                            </Badge>
                                        </div>
                                     </AccordionTrigger>
                                     {!isReadOnly && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-40 hover:opacity-100" onClick={(e) => { e.stopPropagation(); remove(index); }}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                     )}
                                </div>

                                <AccordionContent className="border-t border-white/5 pt-4 pb-4">
                                    <div className="grid grid-cols-6 gap-3 mb-4">
                                        <FormField control={form.control} name={`inventory.${index}.name`} render={({ field }) => (
                                            <div className="col-span-4 space-y-1.5">
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Identificação</FormLabel>
                                                <Input {...field} className="h-8 text-xs bg-black/40 border-white/5 font-bold" readOnly={isReadOnly} />
                                            </div>
                                        )}/>
                                        <FormField control={form.control} name={`inventory.${index}.amount`} render={({ field }) => (
                                            <div className="col-span-1 space-y-1.5">
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center block">Qtd</FormLabel>
                                                <Input type="number" {...field} className="h-8 text-xs text-center bg-black/40 border-white/5 font-mono" readOnly={isReadOnly} />
                                            </div>
                                        )}/>
                                        <FormField control={form.control} name={`inventory.${index}.weight`} render={({ field }) => (
                                            <div className="col-span-1 space-y-1.5">
                                                <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center block">Peso</FormLabel>
                                                <Input type="number" step="0.1" {...field} className="h-8 text-xs text-center bg-black/40 border-white/5 font-mono" readOnly={isReadOnly} />
                                            </div>
                                        )}/>
                                    </div>
                                    <FormField control={form.control} name={`inventory.${index}.description`} render={({ field }) => (
                                        <div className="space-y-1.5">
                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Detalhes & Notas</FormLabel>
                                            <Textarea {...field} className="min-h-[70px] text-[11px] leading-relaxed resize-none bg-black/40 border-white/5 italic text-muted-foreground" readOnly={isReadOnly} />
                                        </div>
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