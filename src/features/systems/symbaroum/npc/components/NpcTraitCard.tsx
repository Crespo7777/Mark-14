import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Control, useWatch, useFormContext } from "react-hook-form";

interface NpcTraitCardProps {
    index: number;
    remove: (index: number) => void;
    isReadOnly?: boolean;
    control: Control<any>;
}

export const NpcTraitCard = ({ index, remove, isReadOnly, control }: NpcTraitCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { setValue } = useFormContext();
    
    const name = useWatch({ control, name: `traits.${index}.name` }) || "Novo Traço";
    const type = useWatch({ control, name: `traits.${index}.type` }) || "Traço"; 
    const level = useWatch({ control, name: `traits.${index}.level` });

    // Configuração de tipos sem o "Monstruoso"
    const typeConfig: Record<string, { color: string, accent: string, icon: any }> = {
        "Traço": { color: "bg-emerald-500", accent: "text-emerald-500", icon: Fingerprint },
        "Dádiva": { color: "bg-amber-500", accent: "text-amber-500", icon: Gem },
        "Fardo": { color: "bg-purple-500", accent: "text-purple-500", icon: Weight },
    };

    const LevelBadgeColor: Record<string, string> = {
        "Novato": "bg-orange-600 text-white border-none",
        "Adepto": "bg-slate-500 text-white border-none",
        "Mestre": "bg-yellow-600 text-white border-none"
    };

    const currentStyle = typeConfig[type] || typeConfig["Traço"];
    const TypeIcon = currentStyle.icon;
    const hasLevel = level && level !== "Sem Nível" && level !== "";

    return (
        <Card className={cn(
            "relative overflow-hidden border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl rounded-xl transition-all duration-300",
            isExpanded ? "ring-2 ring-primary/20" : "opacity-90"
        )}>
            {/* Barra de Acento Superior Dinâmica */}
            <div className={cn("h-1.5 w-full transition-all", currentStyle.color)} />
            
            <CardContent className="p-0">
                <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0 bg-black/20 border border-white/5 shadow-inner")}>
                            <TypeIcon className={cn("w-4 h-4", currentStyle.accent)} />
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate uppercase tracking-tight leading-tight">{name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{type}</span>
                                {hasLevel && (
                                    <Badge className={cn("text-[8px] h-3.5 px-1.5 font-black uppercase shadow-sm", LevelBadgeColor[level] || "bg-secondary")}>
                                        {level}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0 border border-border/40 bg-black/10 hover:bg-black/20" 
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>

                {isExpanded && (
                    <div className="px-3 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <Separator className="mb-4 bg-white/5" />
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-3">
                                <FormField control={control} name={`traits.${index}.name`} render={({field}) => (
                                    <FormItem className="col-span-12 md:col-span-5 space-y-1">
                                        <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Nome</Label>
                                        <FormControl><Input {...field} className="h-8 bg-black/20 border-border/40 text-xs focus-visible:ring-1 focus-visible:ring-primary/30" readOnly={isReadOnly} /></FormControl>
                                    </FormItem>
                                )} />
                                
                                <FormField control={control} name={`traits.${index}.type`} render={({field}) => (
                                    <FormItem className="col-span-6 md:col-span-3 space-y-1">
                                        <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Tipo</Label>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-8 text-xs bg-black/20 border-border/40"><SelectValue /></SelectTrigger></FormControl>
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
                                        <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Nível</Label>
                                        <Select onValueChange={field.onChange} value={field.value || "Sem Nível"} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-8 text-xs bg-black/20 border-border/40"><SelectValue /></SelectTrigger></FormControl>
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

                            <FormField control={control} name={`traits.${index}.description`} render={({field}) => (
                                <FormItem className="space-y-1">
                                    <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Efeitos & Regras</Label>
                                    <div className="min-h-[80px] border border-border/40 rounded-lg bg-black/40 overflow-hidden shadow-inner">
                                        {isReadOnly ? (
                                            <div className="p-3 text-[11px] italic text-muted-foreground"><JournalRenderer content={field.value} /></div>
                                        ) : (
                                            <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Descrição..." className="min-h-[80px] border-none shadow-none text-xs bg-transparent" />
                                        )}
                                    </div>
                                </FormItem>
                            )} />

                            {!isReadOnly && (
                                <Button variant="destructive" size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest mt-2 shadow-lg" onClick={() => remove(index)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Traço
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};