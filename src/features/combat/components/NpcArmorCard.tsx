import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Settings2, Trash2 } from "lucide-react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QualitySelector } from "@/components/QualitySelector";
import { Control, useWatch } from "react-hook-form";

interface NpcArmorCardProps {
  index: number;
  onRemove: () => void;
  tableId: string;
  control: Control<any>;
}

export const NpcArmorCard = ({ index, onRemove, tableId, control }: NpcArmorCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Lemos o valor da qualidade
  const quality = useWatch({ control, name: `armors.${index}.quality` });

  return (
    <Card className="flex items-center justify-between p-2 pl-3 pr-2 transition-all border bg-card shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
            
            <FormField control={control} name={`armors.${index}.equipped`} render={({field}) => (
                <div 
                    onClick={() => field.onChange(!field.value)}
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${field.value ? "bg-blue-500 border-blue-600 text-white shadow-sm" : "bg-muted text-muted-foreground border-transparent hover:bg-muted-foreground/20"}`}
                    title={field.value ? "Equipado (Ativo)" : "Não Equipado"}
                >
                    <Shield className="w-5 h-5 fill-current" />
                </div>
            )} />

            <div className="flex flex-col min-w-0 gap-0.5 w-full">
                <FormField control={control} name={`armors.${index}.name`} render={({field}) => (
                     <Input 
                        {...field} 
                        className="h-6 text-sm font-bold border-none p-0 bg-transparent focus-visible:ring-0 truncate placeholder:text-muted-foreground/50" 
                        placeholder="Nome da Armadura" 
                     />
                )} />
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Redução:</span>
                    <FormField control={control} name={`armors.${index}.protection`} render={({field}) => (
                        <Input 
                            {...field} 
                            type="number" 
                            className="h-5 w-12 text-center font-mono font-bold bg-background/50 border border-border/50 text-foreground p-0 focus:bg-background" 
                            placeholder="0"
                        />
                    )} />
                </div>
                
                {/* EXIBIÇÃO DA QUALIDADE */}
                {quality && (
                    <span className="text-[9px] text-blue-600/80 dark:text-blue-400/80 truncate max-w-[150px]" title={quality}>
                        {quality}
                    </span>
                )}
            </div>
        </div>

        <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full shrink-0">
                    <Settings2 className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
                <div className="space-y-3">
                    <h4 className="font-medium text-xs uppercase text-muted-foreground">Detalhes da Armadura</h4>
                    
                    <FormField control={control} name={`armors.${index}.quality`} render={({ field }) => (
                        <div>
                            <FormLabel className="text-[10px]">Qualidades</FormLabel>
                            <QualitySelector tableId={tableId} value={field.value} onChange={(val) => field.onChange(val)} targetType="armor" />
                        </div>
                    )}/>
                    
                    <Button variant="destructive" size="sm" className="w-full h-7 text-xs mt-2" onClick={onRemove}>
                        <Trash2 className="w-3 h-3 mr-2" /> Excluir Armadura
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    </Card>
  );
};