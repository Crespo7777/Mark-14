import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sword, Dices, Settings2, Trash2, Crosshair, Zap, Tag } from "lucide-react";
import { FormField, FormLabel, FormControl } from "@/components/ui/form"; 
// CORREÇÃO: Constantes do sistema
import { attributesList } from "../../utils/symbaroum.constants";
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
import { Control, useWatch } from "react-hook-form"; 

interface WeaponCardProps {
  index: number;
  onAttack: () => void;
  onDamage: () => void;
  onRemove: () => void;
  projectiles: any[];
  tableId: string;
  control: Control<any>; 
}

export const WeaponCard = ({ index, onAttack, onDamage, onRemove, projectiles, tableId, control }: WeaponCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const name = useWatch({ control, name: `weapons.${index}.name` });
  const damage = useWatch({ control, name: `weapons.${index}.damage` });
  const quality = useWatch({ control, name: `weapons.${index}.quality` });
  const attrKey = useWatch({ control, name: `weapons.${index}.attackAttribute` });
  const projId = useWatch({ control, name: `weapons.${index}.projectileId` });

  const attrLabel = attributesList.find(a => a.key === attrKey)?.label.substring(0, 3).toUpperCase() || "ATR";
  const linkedProjectile = projectiles.find((p: any) => p.id === projId);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card to-orange-500/5 border shadow-sm hover:border-orange-500/30 transition-all group">
      <CardContent className="p-3">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col overflow-hidden mr-2">
                <span className="font-bold text-sm truncate leading-tight" title={name}>{name || "Arma Sem Nome"}</span>
                
                <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1 h-4 font-mono uppercase text-muted-foreground">{attrLabel}</Badge>
                    
                    {linkedProjectile && (
                        <Badge variant={linkedProjectile.quantity > 0 ? "outline" : "destructive"} className="text-[9px] px-1 h-4 gap-1">
                            <Crosshair className="w-2 h-2" /> {linkedProjectile.quantity}
                        </Badge>
                    )}

                    {quality && (
                        <Badge variant="outline" className="text-[9px] px-1 h-4 gap-1 border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-900/20 max-w-[100px] truncate" title={quality}>
                             <Tag className="w-2 h-2" /> {quality}
                        </Badge>
                    )}
                </div>
            </div>

            <Popover open={isEditing} onOpenChange={setIsEditing}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1">
                        <Settings2 className="w-3.5 h-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                    <div className="space-y-3">
                        <h4 className="font-medium text-xs uppercase text-muted-foreground">Editar Arma</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <FormField control={control} name={`weapons.${index}.name`} render={({ field }) => (<div><FormLabel className="text-[10px]">Nome</FormLabel><FormControl><Input {...field} className="h-7 text-xs"/></FormControl></div>)}/>
                            <FormField control={control} name={`weapons.${index}.damage`} render={({ field }) => (<div><FormLabel className="text-[10px]">Dano</FormLabel><FormControl><Input {...field} className="h-7 text-xs"/></FormControl></div>)}/>
                        </div>
                        
                        <FormField control={control} name={`weapons.${index}.attackAttribute`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Atributo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {attributesList.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}/>

                        <FormField control={control} name={`weapons.${index}.projectileId`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Munição</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                                    <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma (Melee)</SelectItem>
                                        {projectiles.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}/>

                        <FormField control={control} name={`weapons.${index}.quality`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Qualidades</FormLabel>
                                <QualitySelector tableId={tableId} value={field.value} onChange={(val) => field.onChange(val)} targetType="weapon" />
                            </div>
                        )}/>

                        <Button variant="destructive" size="sm" className="w-full h-7 text-xs mt-2" onClick={onRemove}>
                            <Trash2 className="w-3 h-3 mr-2" /> Excluir Arma
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        <div className="flex items-center justify-center py-1.5 bg-muted/40 rounded border border-border/40 mb-3">
            <Sword className="w-3.5 h-3.5 text-orange-500 mr-2 opacity-80" />
            <span className="text-lg font-black text-foreground tracking-tight">{damage || "1d4"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <Button 
                variant="outline" 
                size="sm"
                className="h-8 hover:bg-primary/10 hover:text-primary border-primary/20 hover:border-primary/50 text-xs font-bold uppercase tracking-wide"
                onClick={onAttack}
            >
                <Dices className="w-3.5 h-3.5 mr-1.5" /> Atacar
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="h-8 hover:bg-orange-500/10 hover:text-orange-600 border-orange-500/20 hover:border-orange-500/50 text-xs font-bold uppercase tracking-wide"
                onClick={onDamage}
            >
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Dano
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};