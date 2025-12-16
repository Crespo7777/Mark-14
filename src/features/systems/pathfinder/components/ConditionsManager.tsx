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
    const def = CONDITIONS_DB[slug];
    
    if (existingIndex >= 0) {
        // Se não tem valor numérico (ex: Prone), remove ao clicar novamente
        if (!def.hasValue) {
            remove(existingIndex);
        }
    } else {
        // Adiciona nova condição
        append({ slug, value: 1, active: true });
    }
  };

  const updateValue = (index: number, delta: number) => {
      const current = activeConditions[index];
      const newValue = (current.value || 1) + delta;
      
      if (newValue < 1) {
          remove(index);
      } else {
          // Importante: Manter todos os campos do objeto ao atualizar
          update(index, { ...current, value: newValue });
      }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* MENU DE ADICIONAR */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-primary/40 bg-background/50">
                    <AlertCircle className="w-4 h-4 text-primary"/> 
                    <span className="hidden sm:inline">Condições</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto" align="start">
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
                                <div className="flex items-center gap-2">
                                    <cond.icon className="w-4 h-4 opacity-70"/>
                                    <span>{cond.label.split('(')[0]}</span>
                                </div>
                                {isActive && <Badge variant="secondary" className="h-5 text-[10px]">Ativo</Badge>}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* LISTA DE BADGES ATIVAS */}
        <div className="flex flex-wrap gap-2">
            {fields.map((field: any, index) => {
                const def = CONDITIONS_DB[field.slug];
                if (!def) return null; // Proteção contra dados antigos/inválidos

                return (
                    <Badge key={field.id} variant="secondary" className={`h-8 pl-2 pr-1 gap-2 border ${def.color} flex items-center`}>
                        {def.type === 'status' ? <Skull className="w-3 h-3"/> : <Shield className="w-3 h-3"/>}
                        
                        <span className="text-xs font-bold truncate max-w-[120px]" title={def.desc}>
                            {def.label.split('(')[0]}
                        </span>
                        
                        {def.hasValue && (
                            <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 rounded px-1 ml-1">
                                <button type="button" onClick={() => updateValue(index, -1)} className="hover:text-red-500 px-0.5"><Minus className="w-3 h-3"/></button>
                                <span className="w-4 text-center text-sm font-black leading-none">{field.value}</span>
                                <button type="button" onClick={() => updateValue(index, 1)} className="hover:text-green-500 px-0.5"><Plus className="w-3 h-3"/></button>
                            </div>
                        )}
                        
                        <button type="button" onClick={() => remove(index)} className="ml-1 text-muted-foreground/70 hover:text-red-600 p-0.5 rounded-full hover:bg-red-500/10 transition-colors">
                            <X className="w-3 h-3"/>
                        </button>
                    </Badge>
                );
            })}
        </div>
    </div>
  );
};