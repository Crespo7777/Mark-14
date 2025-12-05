import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Settings2, Trash2, Dices } from "lucide-react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QualitySelector } from "@/components/QualitySelector";

interface ArmorCardProps {
  index: number;
  onRoll: () => void;
  onRemove: () => void;
  tableId: string;
}

export const ArmorCard = ({ index, onRoll, onRemove, tableId }: ArmorCardProps) => {
  const { control, watch } = useFormContext();
  const [isEditing, setIsEditing] = useState(false);

  const name = watch(`armors.${index}.name`);
  const protection = watch(`armors.${index}.protection`);
  const equipped = watch(`armors.${index}.equipped`);

  return (
    <Card className={`group flex items-center justify-between p-2 pl-3 pr-2 transition-all border ${equipped ? "border-blue-500/50 bg-blue-500/5 shadow-sm" : "border-border bg-muted/20 opacity-70 hover:opacity-100"}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            {/* Ícone Equipado */}
            <FormField control={control} name={`armors.${index}.equipped`} render={({field}) => (
                <div 
                    onClick={() => field.onChange(!field.value)}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${field.value ? "bg-blue-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"}`}
                    title={field.value ? "Equipado" : "Não Equipado"}
                >
                    <Shield className="w-4 h-4 fill-current" />
                </div>
            )} />

            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate leading-none mb-0.5">{name}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Proteção: <span className="font-mono font-bold text-foreground bg-muted px-1 rounded">{protection}</span>
                </span>
            </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full" 
                onClick={onRoll}
                title="Rolar Proteção"
            >
                <Dices className="w-4 h-4" />
            </Button>

            <Popover open={isEditing} onOpenChange={setIsEditing}>
                <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"><Settings2 className="w-4 h-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                    <div className="space-y-3">
                        <h4 className="font-medium text-xs uppercase text-muted-foreground">Editar Armadura</h4>
                        <FormField control={control} name={`armors.${index}.name`} render={({ field }) => (<div><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs"/></div>)}/>
                        <div className="grid grid-cols-2 gap-2">
                            <FormField control={control} name={`armors.${index}.protection`} render={({ field }) => (<div><FormLabel className="text-[10px]">Proteção</FormLabel><Input {...field} className="h-7 text-xs"/></div>)}/>
                            <FormField control={control} name={`armors.${index}.obstructive`} render={({ field }) => (<div><FormLabel className="text-[10px]">Obstrutiva</FormLabel><Input type="number" {...field} className="h-7 text-xs"/></div>)}/>
                        </div>
                        <FormField control={control} name={`armors.${index}.quality`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Qualidades</FormLabel>
                                <QualitySelector tableId={tableId} value={field.value} onChange={(val) => field.onChange(val)} targetType="armor" />
                            </div>
                        )}/>
                        <Button variant="destructive" size="sm" className="w-full h-7 text-xs mt-2" onClick={onRemove}>
                            <Trash2 className="w-3 h-3 mr-2" /> Excluir
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    </Card>
  );
};