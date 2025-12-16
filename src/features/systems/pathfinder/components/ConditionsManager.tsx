import { useFormContext, useFieldArray } from "react-hook-form";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Shield, AlertCircle, Plus, Minus, X } from "lucide-react";
import { CONDITIONS_DB } from "../utils/pf2eConditions";

export const ConditionsManager = () => {
  const { control, watch } = useFormContext();
  const { fields, append, remove, update } = useFieldArray({ control, name: "active_conditions" });

  const activeConditions = watch("active_conditions") || [];

  const toggleCondition = (slug: string) => {
    const existingIndex = activeConditions.findIndex((c: any) => c.slug === slug);
    
    if (existingIndex >= 0) {
        // Se já existe e não tem valor numérico, remove (toggle off)
        // Se tem valor numérico, não removemos aqui (usa o botão X na lista)
        if (!CONDITIONS_DB[slug].hasValue) {
            remove(existingIndex);
        }
    } else {
        // Adiciona
        append({ slug, value: 1, active: true });
    }
  };

  const updateValue = (index: number, delta: number) => {
      const current = activeConditions[index];
      const newValue = (current.value || 1) + delta;
      if (newValue < 1) remove(index);
      else update(index, { ...current, value: newValue });
  };

  return (
    <div className="flex items-center gap-2">
        {/* DROPDOWN PARA ADICIONAR */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-primary/40">
                    <AlertCircle className="w-4 h-4 text-primary"/> 
                    <span className="hidden sm:inline">Condições</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Adicionar Condição</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="grid gap-1 p-1">
                    {Object.values(CONDITIONS_DB).map((cond) => {
                        const isActive = activeConditions.some((c: any) => c.slug === cond.slug);
                        return (
                            <DropdownMenuItem 
                                key={cond.slug} 
                                onClick={(e) => { e.preventDefault(); toggleCondition(cond.slug); }}
                                className={`flex justify-between cursor-pointer ${isActive ? "bg-primary/10" : ""}`}
                            >
                                <span>{cond.label}</span>
                                {isActive && <Badge variant="secondary" className="h-5 text-[10px]">Ativo</Badge>}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* LISTA DE CONDIÇÕES ATIVAS (BADGES) */}
        <div className="flex flex-wrap gap-2">
            {fields.map((field: any, index) => {
                const def = CONDITIONS_DB[field.slug];
                if (!def) return null;

                return (
                    <Badge key={field.id} variant="secondary" className="h-8 pl-2 pr-1 gap-2 border border-primary/20 bg-background hover:bg-accent flex items-center">
                        {def.type === 'status' ? <Skull className="w-3 h-3 text-red-500"/> : <Shield className="w-3 h-3 text-blue-500"/>}
                        
                        <span className="text-xs font-bold truncate max-w-[100px]">{def.label.split('(')[0]}</span>
                        
                        {def.hasValue && (
                            <div className="flex items-center gap-1 bg-muted rounded px-1 ml-1">
                                <button type="button" onClick={() => updateValue(index, -1)} className="hover:text-red-500"><Minus className="w-3 h-3"/></button>
                                <span className="w-4 text-center text-sm font-black">{field.value}</span>
                                <button type="button" onClick={() => updateValue(index, 1)} className="hover:text-green-500"><Plus className="w-3 h-3"/></button>
                            </div>
                        )}
                        
                        <button type="button" onClick={() => remove(index)} className="ml-1 text-muted-foreground hover:text-red-600 p-1 rounded-full hover:bg-red-100">
                            <X className="w-3 h-3"/>
                        </button>
                    </Badge>
                );
            })}
        </div>
    </div>
  );
};