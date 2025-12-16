import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Sword, Shield, Box, CheckCircle, Circle } from "lucide-react"; // Ícones atualizados
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePathfinderContext } from "../PathfinderContext";
import { WeaponData, ArmorData } from "../pathfinder.schema";

export const InventorySection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, control, watch, setValue } = useFormContext();
  
  // Arrays separados pelo novo Schema
  const weaponsField = useFieldArray({ control, name: "inventory.weapons" });
  const armorsField = useFieldArray({ control, name: "inventory.armors" });
  const gearField = useFieldArray({ control, name: "inventory.gear" });
  
  // Contexto de Carga (Bulk)
  const { bulk } = usePathfinderContext();

  if (!bulk) return <div className="p-4 text-center text-muted-foreground text-xs">A carregar inventário...</div>;

  const maxBulk = bulk.max || 10;
  const bulkPercent = Math.min(100, (bulk.total / maxBulk) * 100);
  
  const getBulkColor = () => {
      if (bulk.total > bulk.max) return "bg-red-500";
      if (bulk.total > bulk.encumbered) return "bg-orange-500";
      return "bg-green-500";
  };

  // Componente Genérico de Lista
  const InventoryGroup = ({ title, fieldArray, namePrefix, icon: Icon, colorClass, type }: any) => {
    const fields = fieldArray.fields;
    
    // Função para alternar equipamento (Só para Armas e Armaduras)
    const toggleEquip = (index: number) => {
        const current = watch(`${namePrefix}.${index}.equipped`);
        setValue(`${namePrefix}.${index}.equipped`, !current, { shouldDirty: true });
    };

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
                    onClick={() => fieldArray.append({ name: "Novo Item", quantity: 1, bulk: "L", type: "melee" })} // Default props
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
                          {type !== 'gear' && <TableHead className="w-[5%] text-center p-0">Eqp</TableHead>}
                          <TableHead className="pl-4 h-8 text-[10px] font-bold text-muted-foreground uppercase w-[55%]">Nome</TableHead>
                          <TableHead className="h-8 text-[10px] font-bold text-muted-foreground uppercase text-center w-[15%]">Qtd</TableHead>
                          <TableHead className="h-8 text-[10px] font-bold text-muted-foreground uppercase text-center w-[15%]">Bulk</TableHead>
                          {!isReadOnly && <TableHead className="w-[10%]"></TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {fields.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={type !== 'gear' ? 5 : 4} className="text-center h-12 text-muted-foreground text-xs italic bg-muted/5">
                                  Nenhum item nesta categoria.
                              </TableCell>
                          </TableRow>
                      )}
                      
                      {fields.map((item: any, index: number) => {
                          const isEquipped = watch(`${namePrefix}.${index}.equipped`);
                          
                          return (
                          <TableRow key={item.id} className={`hover:bg-muted/5 border-b border-border/40 last:border-0 ${isEquipped ? "bg-primary/5" : ""}`}>
                              
                              {/* Checkbox de Equipar (Só Armas/Armaduras) */}
                              {type !== 'gear' && (
                                  <TableCell className="p-0 text-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6" 
                                        onClick={() => toggleEquip(index)}
                                        disabled={isReadOnly}
                                        title={isEquipped ? "Desequipar" : "Equipar"}
                                      >
                                          {isEquipped 
                                            ? <CheckCircle className="w-4 h-4 text-green-600 fill-green-100" /> 
                                            : <Circle className="w-4 h-4 text-muted-foreground/30" />
                                          }
                                      </Button>
                                  </TableCell>
                              )}

                              <TableCell className="pl-4 py-1">
                                  <div className="flex flex-col">
                                      <Input 
                                        {...register(`${namePrefix}.${index}.name`)} 
                                        className="h-8 border-transparent bg-transparent focus:bg-background focus:border-input font-bold text-sm px-2" 
                                        placeholder="Nome do Item" 
                                        readOnly={isReadOnly}
                                      />
                                      {/* Campos extras para Armas/Armaduras (Traits, Dano, etc) podem ser um Popover ou Expandable Row no futuro */}
                                      {type === 'weapon' && (
                                          <div className="flex gap-2 px-2 pb-1">
                                              <Input {...register(`${namePrefix}.${index}.damage_dice`)} className="h-5 w-8 text-[10px] p-0 text-center bg-muted/20 border-none" placeholder="1"/>
                                              <Input {...register(`${namePrefix}.${index}.damage_die`)} className="h-5 w-10 text-[10px] p-0 text-center bg-muted/20 border-none" placeholder="d8"/>
                                              <Input {...register(`${namePrefix}.${index}.traits`)} className="h-5 flex-1 text-[10px] p-0 px-2 bg-muted/20 border-none" placeholder="Traits (Agile, Finesse...)"/>
                                          </div>
                                      )}
                                      {type === 'armor' && (
                                          <div className="flex gap-2 px-2 pb-1">
                                              <Input {...register(`${namePrefix}.${index}.ac_bonus`)} className="h-5 w-12 text-[10px] p-0 text-center bg-muted/20 border-none" placeholder="AC+"/>
                                              <Input {...register(`${namePrefix}.${index}.dex_cap`)} className="h-5 w-12 text-[10px] p-0 text-center bg-muted/20 border-none" placeholder="Dex Cap"/>
                                              <Input {...register(`${namePrefix}.${index}.check_penalty`)} className="h-5 w-12 text-[10px] p-0 text-center bg-muted/20 border-none" placeholder="ACP"/>
                                          </div>
                                      )}
                                  </div>
                              </TableCell>
                              <TableCell className="py-1">
                                  <Input 
                                    type="number" 
                                    {...register(`${namePrefix}.${index}.quantity`)} 
                                    className="h-8 text-center bg-transparent border-transparent focus:bg-background focus:border-input px-0 font-medium" 
                                    readOnly={isReadOnly}
                                  />
                              </TableCell>
                              <TableCell className="py-1">
                                  <Input 
                                    {...register(`${namePrefix}.${index}.bulk`)} 
                                    className="h-8 text-center bg-transparent border-transparent focus:bg-background focus:border-input uppercase text-xs font-bold text-muted-foreground px-0" 
                                    placeholder="L" 
                                    readOnly={isReadOnly}
                                  />
                              </TableCell>
                              {!isReadOnly && (
                                  <TableCell className="py-1 text-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-muted-foreground hover:text-red-500" 
                                        onClick={() => fieldArray.remove(index)}
                                      >
                                          <Trash2 className="w-3.5 h-3.5"/>
                                      </Button>
                                  </TableCell>
                              )}
                          </TableRow>
                      )})}
                  </TableBody>
              </Table>
          </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1. MOEDAS E CARGA (Mantido igual, muito bom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-2 border-primary/20 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                  {/* ... (código visual de carga mantido igual ao teu) ... */}
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full border-2 ${bulk.total > bulk.encumbered ? "bg-red-50 border-red-200 text-red-600" : "bg-primary/5 border-primary/10 text-primary"}`}>
                          <Label className="sr-only">Carga</Label>
                          {/* Usei um ícone simples aqui, podes manter o teu Weight */}
                          <div className="font-black text-xl">{bulk.total.toFixed(1)}</div>
                      </div>
                      <div>
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Carga (Bulk)</Label>
                          <div className="text-xs text-muted-foreground">
                              Máx: {bulk.max} | Enc: {bulk.encumbered}
                          </div>
                      </div>
                  </div>
                  <div className="flex-1 w-full sm:max-w-xs">
                      <Progress value={bulkPercent} className="h-4 border border-border" indicatorClassName={getBulkColor()} />
                  </div>
              </div>
          </Card>

          {/* Moedas (Mantido igual) */}
          {/* ... */}
      </div>

      {/* 2. LISTAS DE ITENS (Armas, Armaduras, Gear) */}
      <div className="space-y-6">
          <InventoryGroup 
            title="Armas & Ataques" 
            fieldArray={weaponsField} 
            namePrefix="inventory.weapons"
            icon={Sword} 
            colorClass="border-orange-200 bg-orange-50/5" 
            type="weapon"
          />
          
          <InventoryGroup 
            title="Armaduras & Proteção" 
            fieldArray={armorsField} 
            namePrefix="inventory.armors"
            icon={Shield} 
            colorClass="border-blue-200 bg-blue-50/5" 
            type="armor"
          />
          
          <InventoryGroup 
            title="Mochila & Equipamento" 
            fieldArray={gearField} 
            namePrefix="inventory.gear"
            icon={Box} 
            colorClass="border-primary/20 bg-card" 
            type="gear"
          />
      </div>

    </div>
  );
};