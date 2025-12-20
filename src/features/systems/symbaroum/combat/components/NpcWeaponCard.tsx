import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sword, Settings2, Trash2, Zap, Tag } from "lucide-react";
import { FormField, FormLabel, FormControl } from "@/components/ui/form"; 
import { attributesList } from "../../utils/symbaroum.constants";
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
import { Control, useWatch } from "react-hook-form"; 

interface NpcWeaponCardProps {
  index: number;
  onRemove: () => void;
  tableId: string;
  control: Control<any>; 
}

export const NpcWeaponCard = ({ index, onRemove, tableId, control }: NpcWeaponCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const name = useWatch({ control, name: `weapons.${index}.name` });
  const damage = useWatch({ control, name: `weapons.${index}.damage` });
  const quality = useWatch({ control, name: `weapons.${index}.quality` });
  const attrKey = useWatch({ control, name: `weapons.${index}.attackAttribute` });

  // Cálculo do Modificador para NPC
  const attrValue = useWatch({ control, name: `attributes.${attrKey}.value` }) ?? 10;
  const modifier = 10 - attrValue;
  const modString = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  const attrLabel = attributesList.find(a => a.key === attrKey)?.label.substring(0, 3).toUpperCase() || "ATR";

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card to-orange-500/5 border shadow-sm hover:border-orange-500/30 transition-all group">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col overflow-hidden mr-2">
                <span className="font-bold text-sm truncate leading-tight" title={name}>{name || "Arma Sem Nome"}</span>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1 h-4 font-mono uppercase text-muted-foreground">
                        {attrLabel} ({modString})
                    </Badge>
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
                        <h4 className="font-medium text-xs uppercase text-muted-foreground">Editar Ataque (NPC)</h4>
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

        <div className="flex items-center justify-center py-1.5 bg-muted/40 rounded border border-border/40">
            <Sword className="w-3.5 h-3.5 text-orange-500 mr-2 opacity-80" />
            <span className="text-lg font-black text-foreground tracking-tight">{damage || ""}</span>
        </div>
      </CardContent>
    </Card>
  );
};