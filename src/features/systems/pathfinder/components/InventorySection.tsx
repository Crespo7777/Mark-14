import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Backpack, Coins, Weight, Shirt, Hand, Box, Package } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePathfinderContext } from "../PathfinderContext";

export const InventorySection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "inventory" });
  
  // Contexto de Carga (Bulk)
  const { bulk } = usePathfinderContext();

  // Guard Clause
  if (!bulk) return <div className="p-4 text-center text-muted-foreground text-xs">A carregar inventário...</div>;

  const maxBulk = bulk.max || 10;
  const bulkPercent = Math.min(100, (bulk.total / maxBulk) * 100);
  
  const getBulkColor = () => {
      if (bulk.total > bulk.max) return "bg-red-500";
      if (bulk.total > bulk.encumbered) return "bg-orange-500";
      return "bg-green-500";
  };

  // Componente Auxiliar para Categoria
  const InventoryGroup = ({ title, typeFilter, icon: Icon, colorClass }: any) => {
    // Filtra visualmente
    const groupFields = fields.map((field, index) => ({ ...field, index })).filter((item: any) => {
        const itemType = watch(`inventory.${item.index}.type`) || "other";
        return itemType === typeFilter;
    });

    return (
      <Card className={`border-2 ${colorClass} shadow-sm mb-6`}>
          <div className="p-3 bg-muted/20 flex justify-between items-center border-b border-border/10">
             <h3 className="font-bold flex items-center gap-2 text-primary text-sm uppercase tracking-wide">
                 <Icon className="w-4 h-4"/> {title}
             </h3>
             {!isReadOnly && (
                 <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => append({ name: "Novo Item", quantity: 1, bulk: "L", type: typeFilter })} 
                    className="h-7 text-xs gap-1 hover:bg-background/50"
                 >
                     <Plus className="w-3 h-3"/> Adicionar
                 </Button>
             )}
          </div>
          
          <div className="overflow-hidden">
              <Table>
                  <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/5">
                          <TableHead className="pl-4 h-8 text-[10px] font-bold text-muted-foreground uppercase w-[60%]">Item</TableHead>
                          <TableHead className="h-8 text-[10px] font-bold text-muted-foreground uppercase text-center w-[15%]">Qtd</TableHead>
                          <TableHead className="h-8 text-[10px] font-bold text-muted-foreground uppercase text-center w-[15%]">Bulk</TableHead>
                          {!isReadOnly && <TableHead className="w-[10%]"></TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {groupFields.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={4} className="text-center h-12 text-muted-foreground text-xs italic bg-muted/5">
                                  Vazio.
                              </TableCell>
                          </TableRow>
                      )}
                      
                      {groupFields.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/5 border-b border-border/40 last:border-0">
                              <TableCell className="pl-4 py-1">
                                  <Input 
                                    {...register(`inventory.${item.index}.name`)} 
                                    className="h-8 border-transparent bg-transparent focus:bg-background focus:border-input font-bold text-sm px-2" 
                                    placeholder="Nome do Item" 
                                    readOnly={isReadOnly}
                                  />
                              </TableCell>
                              <TableCell className="py-1">
                                  <Input 
                                    type="number" 
                                    {...register(`inventory.${item.index}.quantity`)} 
                                    className="h-8 text-center bg-transparent border-transparent focus:bg-background focus:border-input px-0 font-medium" 
                                    readOnly={isReadOnly}
                                  />
                              </TableCell>
                              <TableCell className="py-1">
                                  <Input 
                                    {...register(`inventory.${item.index}.bulk`)} 
                                    className="h-8 text-center bg-transparent border-transparent focus:bg-background focus:border-input uppercase text-xs font-bold text-muted-foreground px-0" 
                                    placeholder="-" 
                                    readOnly={isReadOnly}
                                  />
                              </TableCell>
                              {!isReadOnly && (
                                  <TableCell className="py-1 text-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-muted-foreground hover:text-red-500" 
                                        onClick={() => remove(item.index)}
                                      >
                                          <Trash2 className="w-3.5 h-3.5"/>
                                      </Button>
                                  </TableCell>
                              )}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1. MOEDAS E CARGA (Compacto) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carga */}
          <Card className="lg:col-span-2 bg-card border-2 border-primary/20 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full border-2 ${bulk.total > bulk.encumbered ? "bg-red-50 border-red-200 text-red-600" : "bg-primary/5 border-primary/10 text-primary"}`}>
                          <Weight className="w-6 h-6"/>
                      </div>
                      <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Carga Total (Bulk)</Label>
                          <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-primary">{bulk.total.toFixed(1)}</span>
                              <div className="text-xs text-muted-foreground flex flex-col">
                                  <span>Limite: {bulk.encumbered}</span>
                                  <span>Máx: {bulk.max}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="flex-1 w-full sm:max-w-xs">
                      <Progress value={bulkPercent} className="h-4 border border-border" indicatorClassName={getBulkColor()} />
                  </div>
              </div>
          </Card>

          {/* Moedas */}
          <Card className="bg-card border-2 border-primary/20 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/20">
                  <Coins className="w-4 h-4 text-yellow-500"/>
                  <span className="text-xs font-bold uppercase text-muted-foreground">Tesouro</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  {['pp', 'gp', 'sp', 'cp'].map((coin) => (
                      <div key={coin} className="flex items-center bg-muted/10 rounded px-2 py-1 border border-transparent hover:border-primary/20 transition-colors">
                          <Label className="text-[10px] font-bold uppercase w-6 text-muted-foreground">{coin}</Label>
                          <Input 
                            type="number" 
                            {...register(`money.${coin}`)} 
                            className="h-6 text-right font-bold bg-transparent border-none p-0 focus-visible:ring-0" 
                            placeholder="0"
                            readOnly={isReadOnly}
                          />
                      </div>
                  ))}
              </div>
          </Card>
      </div>

      {/* 2. LISTAS DE ITENS CATEGORIZADAS (SEM STATUS) */}
      <div className="space-y-6">
          <InventoryGroup 
            title="Itens Vestidos (Worn)" 
            typeFilter="worn" 
            icon={Shirt} 
            colorClass="border-blue-200 bg-blue-50/5" 
          />
          
          <InventoryGroup 
            title="Itens Preparados (Readied)" 
            typeFilter="readied" 
            icon={Hand} 
            colorClass="border-yellow-200 bg-yellow-50/5" 
          />
          
          <InventoryGroup 
            title="Outros Itens (Mochila)" 
            typeFilter="other" 
            icon={Box} 
            colorClass="border-primary/20 bg-card" 
          />
      </div>

    </div>
  );
};