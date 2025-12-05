import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, ChevronDown, ChevronUp, Fingerprint, Gem, Weight } from "lucide-react";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { JournalRenderer } from "@/components/JournalRenderer";
import { cn } from "@/lib/utils";

interface TraitCardProps {
  index: number;
  remove: (index: number) => void;
  isReadOnly?: boolean;
}

export const TraitCard = ({ index, remove, isReadOnly }: TraitCardProps) => {
    const { control, watch } = useFormContext();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const name = watch(`traits.${index}.name`) || "Novo Traço";
    const type = watch(`traits.${index}.type`) || "Traço"; 
    const level = watch(`traits.${index}.level`);

    // Configuração Visual por Tipo
    const typeConfig: Record<string, { color: string, icon: any }> = {
        "Traço": { color: "border-emerald-500/50 bg-emerald-500/5 text-emerald-600", icon: Fingerprint },
        "Dádiva": { color: "border-amber-500/50 bg-amber-500/5 text-amber-600", icon: Gem },
        "Fardo": { color: "border-purple-500/50 bg-purple-500/5 text-purple-600", icon: Weight },
    };

    // Cores dos Níveis
    const LevelBadgeColor: Record<string, string> = {
        "Novato": "bg-orange-600/90 border-none text-white",
        "Adepto": "bg-slate-500/90 border-none text-white",
        "Mestre": "bg-yellow-600/90 border-none text-white"
    };

    const currentStyle = typeConfig[type] || typeConfig["Traço"];
    const TypeIcon = currentStyle.icon;
    const hasLevel = level && level !== "Sem Nível" && level !== "";

    return (
        <Card className={cn("transition-all duration-200 shadow-sm overflow-hidden border-l-4", currentStyle.color, isExpanded ? "ring-1 ring-primary/20" : "")}>
            
            {/* CABEÇALHO (Compacto e Alinhado) */}
            <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 rounded-lg shrink-0 bg-background/50 border", currentStyle.color.split(" ")[0])}>
                        <TypeIcon className={cn("w-4 h-4", currentStyle.color.split(" ")[2])} />
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate leading-tight" title={name}>{name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{type}</span>
                            {hasLevel && (
                                <Badge className={cn("text-[9px] h-4 px-1.5", LevelBadgeColor[level] || "bg-secondary")}>
                                    {level}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            </div>

            {/* CONTEÚDO EXPANDIDO */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 fade-in duration-200 bg-muted/5">
                    <Separator className="mb-3" />
                    
                    {/* Linha 1: Nome e Tipo */}
                    <div className="grid grid-cols-12 gap-3 mb-3">
                        <FormField control={control} name={`traits.${index}.name`} render={({field}) => (
                            <FormItem className="col-span-12 md:col-span-5 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nome</Label>
                                <FormControl><Input {...field} className="h-8 text-xs bg-background" readOnly={isReadOnly} /></FormControl>
                            </FormItem>
                        )} />
                        
                        <FormField control={control} name={`traits.${index}.type`} render={({field}) => (
                            <FormItem className="col-span-6 md:col-span-3 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Tipo</Label>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Traço">Traço</SelectItem>
                                        <SelectItem value="Dádiva">Dádiva</SelectItem>
                                        <SelectItem value="Fardo">Fardo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={control} name={`traits.${index}.level`} render={({field}) => (
                            <FormItem className="col-span-6 md:col-span-4 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nível (Opcional)</Label>
                                <Select onValueChange={field.onChange} value={field.value || "Sem Nível"} disabled={isReadOnly}>
                                    <FormControl><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Sem Nível">Sem Nível</SelectItem>
                                        <SelectItem value="Novato">Novato</SelectItem>
                                        <SelectItem value="Adepto">Adepto</SelectItem>
                                        <SelectItem value="Mestre">Mestre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                    {/* Linha 2: Descrição */}
                    <FormField control={control} name={`traits.${index}.description`} render={({field}) => (
                        <FormItem className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Efeitos & Regras</Label>
                            <div className="min-h-[80px] border rounded-md bg-background text-sm">
                                {isReadOnly ? (
                                    <div className="p-2"><JournalRenderer content={field.value} /></div>
                                ) : (
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Descrição..." className="min-h-[80px] border-none shadow-none text-xs" />
                                )}
                            </div>
                        </FormItem>
                    )} />

                    {!isReadOnly && (
                        <Button variant="ghost" size="sm" className="w-full mt-3 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                            <Trash2 className="w-3 h-3 mr-2" /> Remover
                        </Button>
                    )}
                </div>
            )}
        </Card>
    );
};