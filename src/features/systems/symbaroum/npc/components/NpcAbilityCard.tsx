import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Zap, Dices, Scroll, Sparkles, ChevronDown, ChevronUp, Power } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RichTextEditor } from "@/components/RichTextEditor";
import { JournalRenderer } from "@/components/JournalRenderer";
import { attributesList } from "@/features/systems/symbaroum/utils/symbaroum.constants";
import { cn } from "@/lib/utils";
import { Control, useWatch } from "react-hook-form";

export const NpcAbilityCard = ({ index, remove, isReadOnly, handleRoll, control, setValue }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const name = useWatch({ control, name: `abilities.${index}.name` }) || "Nova Habilidade";
    const isActive = useWatch({ control, name: `abilities.${index}.isActive` });
    const level = useWatch({ control, name: `abilities.${index}.level` }) || "Novato";
    const type = useWatch({ control, name: `abilities.${index}.type` });
    const attrKey = useWatch({ control, name: `abilities.${index}.associatedAttribute` });
    const corruption = useWatch({ control, name: `abilities.${index}.corruptionCost` });
    
    const hasAttr = attrKey && attrKey !== "Nenhum";

    const handleMainAction = () => {
        if (hasAttr) { handleRoll(index); } 
        else { setValue(`abilities.${index}.isActive`, !isActive, { shouldDirty: true, shouldTouch: true }); }
    };

    const TypeIcon = type === "Ritual" ? Scroll : type === "Poder" ? Sparkles : Zap;

    return (
        <Card className={cn(
            "relative overflow-hidden border border-border/60 bg-background/80 shadow-2xl backdrop-blur-xl rounded-xl transition-all duration-300",
            isActive ? "border-amber-500/40 ring-1 ring-amber-500/10" : "opacity-90",
            isExpanded ? "ring-2 ring-primary/20" : ""
        )}>
            {/* Barra de Acento Superior - Âmbar */}
            <div className={cn("h-1.5 w-full transition-all", isActive ? "bg-amber-500" : "bg-slate-700")} />

            <CardContent className="p-0">
                <div className="p-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0 transition-colors", isActive ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground")}>
                            <TypeIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex flex-col min-w-0 w-full">
                            <div className="flex items-center justify-between w-full">
                                <span className={cn("font-bold text-sm truncate uppercase tracking-tight transition-colors", isActive ? "text-amber-500" : "")}>
                                    {name}
                                </span>
                                
                                <FormField control={control} name={`abilities.${index}.isActive`} render={({field}) => (
                                    <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange} 
                                        disabled={isReadOnly} 
                                        className="scale-75 ml-2 data-[state=checked]:bg-amber-500" 
                                    />
                                )}/>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                                <Badge className="text-[9px] h-4 px-1.5 border-none bg-amber-600 text-white font-black uppercase">
                                    {level}
                                </Badge>
                                {hasAttr && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-black/20 border-border/40 text-muted-foreground font-bold">
                                        {attributesList.find(a => a.key === attrKey)?.label || attrKey}
                                    </Badge>
                                )}
                                {corruption && corruption !== "0" && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-purple-500/30 text-purple-400 bg-purple-500/10 font-bold">
                                        {corruption} CORR.
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-3 pb-3 flex gap-2">
                    <Button 
                        size="sm" 
                        variant={isActive ? "default" : (hasAttr ? "default" : "secondary")} 
                        className={cn(
                            "flex-1 h-8 text-[10px] font-black uppercase tracking-widest transition-all", 
                            isActive ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_0_10px_rgba(22,163,74,0.4)]" : (hasAttr ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-black/20 hover:bg-black/40")
                        )}
                        onClick={handleMainAction}
                    >
                        {hasAttr ? (
                            <><Dices className="w-3.5 h-3.5 mr-1.5"/> Testar</>
                        ) : (
                            isActive ? <><Power className="w-3.5 h-3.5 mr-1.5"/> Desativar</> : <><Zap className="w-3.5 h-3.5 mr-1.5"/> Ativar</>
                        )}
                    </Button>
                    
                    <Button 
                        size="sm" variant="ghost" className="h-8 w-8 p-0 border border-border/40 bg-black/10" 
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>

                {isExpanded && (
                    <div className="px-3 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <Separator className="mb-4 bg-white/5" />
                        
                        <div className="space-y-4">
                            <FormField control={control} name={`abilities.${index}.name`} render={({field}) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Nome da Habilidade</FormLabel>
                                    <FormControl><Input {...field} className="h-8 bg-black/20 border-border/40 text-xs" readOnly={isReadOnly} /></FormControl>
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={control} name={`abilities.${index}.level`} render={({field}) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Nível</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-8 text-xs bg-black/20 border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Novato">Novato</SelectItem><SelectItem value="Adepto">Adepto</SelectItem><SelectItem value="Mestre">Mestre</SelectItem></SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                
                                <FormField control={control} name={`abilities.${index}.type`} render={({field}) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-8 text-xs bg-black/20 border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder Místico</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={control} name={`abilities.${index}.associatedAttribute`} render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Atributo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                            <FormControl><SelectTrigger className="h-8 text-xs bg-black/20 border-border/40"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Nenhum">Nenhum</SelectItem>
                                                <Separator />
                                                {attributesList.map((attr) => (<SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                
                                <FormField control={control} name={`abilities.${index}.corruptionCost`} render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-[9px] text-purple-400 uppercase font-black tracking-widest">Corrupção</FormLabel>
                                        <FormControl><Input placeholder="1d4" {...field} className="h-8 bg-black/20 border-border/40 text-xs" readOnly={isReadOnly} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={control} name={`abilities.${index}.description`} render={({field}) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Regras & Efeitos</FormLabel>
                                    <div className="min-h-[100px] border border-border/40 rounded-lg bg-black/40 overflow-hidden shadow-inner">
                                        {isReadOnly ? (
                                            <div className="p-3 text-[11px] leading-relaxed italic text-muted-foreground"><JournalRenderer content={field.value} /></div>
                                        ) : (
                                            <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Descrição..." className="min-h-[100px] border-none shadow-none text-xs bg-transparent" />
                                        )}
                                    </div>
                                </FormItem>
                            )} />

                            {!isReadOnly && (
                                <Button variant="destructive" size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest" onClick={() => remove(index)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover Habilidade
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};