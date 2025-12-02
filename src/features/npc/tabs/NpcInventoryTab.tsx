import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Backpack, Trash2, Plus, Database, PenTool, Package, Weight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel, FormControl, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";

// --- CONFIGURAÇÃO: O QUE PODE ENTRAR NA MOCHILA ---
// Removemos 'service', 'weapon', 'armor', 'ability', 'trait'
const ALLOWED_CATEGORIES = [
    "general",      // Equipamento Geral
    "consumable",   // Consumíveis / Poções
    "container",    // Recipientes
    "tool",         // Ferramentas
    "spec_tool",    // Ferramentas Especiais
    "clothing",     // Roupas
    "food",         // Comida
    "material",     // Materiais
    "valuable",     // Valiosos
    "artifact",     // Artefatos
    "ammunition",   // Munição (para controle de estoque)
    "musical",      // Instrumentos
    "trap",         // Armadilhas (o item físico)
    "asset",        // Tesouros
    "construction", // Escrituras/Construções
    "mount",        // Montarias
    "animal"        // Animais
];

export const NpcInventoryTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet();
  const { toast } = useToast();
  
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [isDbOpen, setIsDbOpen] = useState(false);

  // Array do Inventário
  const { fields, append, remove } = useFieldArray({ 
      control: form.control, 
      name: "inventory" 
  });

  // --- HANDLER: ADICIONAR DO BANCO ---
  const handleAddFromDb = (item: any) => {
      const data = item.data || {};
      append({
          name: item.name,
          description: item.description || "",
          amount: 1,
          weight: parseFloat(item.weight) || 0,
          price: data.price || ""
      });
      toast({ title: "Item Adicionado", description: `${item.name} foi colocado na mochila.` });
      setIsDbOpen(false);
  };

  // --- HANDLER: ADICIONAR MANUALMENTE ---
  const handleManualAdd = () => {
      append({
          name: "Novo Item",
          description: "",
          amount: 1,
          weight: 0,
          price: ""
      });
  };

  // Cálculo Automático de Peso
  const totalWeight = fields.reduce((acc, item, idx) => {
      const w = parseFloat(form.watch(`inventory.${idx}.weight`) || "0");
      const q = parseFloat(form.watch(`inventory.${idx}.amount`) || "0");
      return acc + (w * q);
  }, 0);

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      
      {/* --- CARD PRINCIPAL --- */}
      <Card className="flex flex-col border-t-4 border-t-emerald-600 shadow-sm flex-1">
        
        {/* CABEÇALHO DO CARD (Igual às outras abas) */}
        <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Backpack className="w-4 h-4 text-emerald-600" /> Mochila & Pertences
                </CardTitle>
                
                {/* Badge de Peso Total */}
                {totalWeight > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal bg-background/80 border-emerald-200 text-emerald-700">
                        <Weight className="w-3 h-3 mr-1" /> {totalWeight.toFixed(1)} kg
                    </Badge>
                )}
            </div>
            
            {/* MENU DROPDOWN DE AÇÃO */}
            {!isReadOnly && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
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
        
        {/* LISTA DE ITENS */}
        <CardContent className="p-2 flex-1 overflow-y-auto">
            {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg m-2 bg-muted/5">
                    <Package className="w-10 h-10 mb-2 opacity-20" />
                    <span className="text-sm">A mochila está vazia.</span>
                </div>
            )}

            <Accordion type="multiple" className="space-y-2" value={openItems} onValueChange={setOpenItems}>
                {fields.map((field, index) => (
                    <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                        {/* CABEÇALHO DO ITEM (Fechado) */}
                        <div className="flex items-center justify-between py-2">
                            <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1 mr-2">
                                <div className="flex flex-col items-start text-left gap-1">
                                    <span className="font-semibold text-sm">{form.watch(`inventory.${index}.name`) || "Item"}</span>
                                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                                        <span className="bg-muted px-1.5 rounded border font-mono text-foreground">x{form.watch(`inventory.${index}.amount`)}</span>
                                        {Number(form.watch(`inventory.${index}.weight`)) > 0 && (
                                            <span>{(Number(form.watch(`inventory.${index}.weight`)) * Number(form.watch(`inventory.${index}.amount`))).toFixed(1)} kg</span>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-50 hover:opacity-100 text-destructive"
                                onClick={() => remove(index)}
                                disabled={isReadOnly}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>

                        {/* DETALHES DO ITEM (Aberto) */}
                        <AccordionContent className="border-t pt-2 space-y-3">
                            <div className="grid grid-cols-6 gap-2">
                                <FormField control={form.control} name={`inventory.${index}.name`} render={({ field }) => (
                                    <div className="col-span-4 space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                                )}/>
                                <FormField control={form.control} name={`inventory.${index}.amount`} render={({ field }) => (
                                    <div className="col-span-1 space-y-1"><FormLabel className="text-[10px]">Qtd</FormLabel><Input type="number" {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                                )}/>
                                <FormField control={form.control} name={`inventory.${index}.weight`} render={({ field }) => (
                                    <div className="col-span-1 space-y-1"><FormLabel className="text-[10px]">Peso</FormLabel><Input type="number" {...field} className="h-7 text-xs" readOnly={isReadOnly} /></div>
                                )}/>
                            </div>
                            <FormField control={form.control} name={`inventory.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px]">Descrição</FormLabel><FormControl><Textarea {...field} className="min-h-[50px] text-xs resize-none" placeholder="Detalhes do item..." readOnly={isReadOnly}/></FormControl></FormItem>
                            )}/>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>

      {/* --- DIÁLOGO DO BANCO DE DADOS --- */}
      <ItemSelectorDialog
        open={isDbOpen}
        onOpenChange={setIsDbOpen}
        onSelect={handleAddFromDb}
        categories={ALLOWED_CATEGORIES} // Lista filtrada (sem serviços)
        title="Adicionar à Mochila"
        tableId={npc.table_id}
      />
    </div>
  );
};