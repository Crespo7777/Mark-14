import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Zap, Dices, Scroll, Sparkles, ChevronDown, ChevronUp, Settings2, Power } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RichTextEditor } from "@/components/RichTextEditor";
import { JournalRenderer } from "@/components/JournalRenderer";
import { attributesList } from "@/features/systems/symbaroum/utils/symbaroum.constants";
import { cn } from "@/lib/utils";
import { Control, useWatch } from "react-hook-form";

interface NpcAbilityCardProps {
  index: number;
  remove: (index: number) => void;
  isReadOnly?: boolean;
  handleRoll: (index: number) => void;
  control: Control<any>;
  setValue: any;
}

export const NpcAbilityCard = ({ index, remove, isReadOnly, handleRoll, control, setValue }: NpcAbilityCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Usar useWatch para reatividade
    const name = useWatch({ control, name: `abilities.${index}.name` }) || "Nova Habilidade";
    const isActive = useWatch({ control, name: `abilities.${index}.isActive` });
    const level = useWatch({ control, name: `abilities.${index}.level` }) || "Novato";
    const type = useWatch({ control, name: `abilities.${index}.type` });
    const attrKey = useWatch({ control, name: `abilities.${index}.associatedAttribute` });
    const corruption = useWatch({ control, name: `abilities.${index}.corruptionCost` });
    
    const hasAttr = attrKey && attrKey !== "Nenhum";

    const handleMainAction = () => {
        if (hasAttr) {
            handleRoll(index);
        } else {
            setValue(`abilities.${index}.isActive`, !isActive, { shouldDirty: true, shouldTouch: true });
        }
    };

    const levelStyles: Record<string, string> = { 
        "Novato": "border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60", 
        "Adepto": "border-slate-400/40 bg-slate-400/5 hover:border-slate-400/60", 
        "Mestre": "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60" 
    };

    const LevelBadgeColor: Record<string, string> = {
        "Novato": "bg-orange-600/90 hover:bg-orange-600",
        "Adepto": "bg-slate-500/90 hover:bg-slate-500",
        "Mestre": "bg-yellow-600/90 hover:bg-yellow-600"
    };

    const TypeIcon = type === "Ritual" ? Scroll : type === "Poder" ? Sparkles : Zap;

    return (
        <Card className={cn("transition-all duration-300 shadow-sm overflow-hidden border-l-4", levelStyles[level] || "border-border", isExpanded ? "ring-1 ring-primary/20" : "")}>
            
            <div className="p-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 rounded-lg shrink-0 transition-colors", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        <TypeIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex flex-col min-w-0 w-full">
                        <div className="flex items-center justify-between w-full">
                            <span className={cn("font-bold text-base truncate leading-tight transition-colors", isActive ? "text-primary" : "")} title={name}>
                                {name}
                            </span>
                            
                            <FormField control={control} name={`abilities.${index}.isActive`} render={({field}) => (
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                    disabled={isReadOnly} 
                                    className="scale-75 ml-2 data-[state=checked]:bg-primary" 
                                />
                            )}/>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                            <Badge className={cn("text-[9px] h-4 px-1.5 border-none text-white font-medium", LevelBadgeColor[level] || "bg-secondary")}>
                                {level}
                            </Badge>
                            {hasAttr && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-background/50">
                                    {attributesList.find(a => a.key === attrKey)?.label || attrKey}
                                </Badge>
                            )}
                            {corruption && corruption !== "0" && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/5">
                                    {corruption} Corr.
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
                        "flex-1 h-8 text-xs font-semibold shadow-sm transition-all", 
                        isActive ? "bg-green-600 hover:bg-green-700 text-white" : (hasAttr ? "bg-primary/90 hover:bg-primary" : "")
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
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <Separator className="mb-3" />
                    
                    <div className="mb-3">
                        <FormField control={control} name={`abilities.${index}.name`} render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Nome da Habilidade</FormLabel>
                                <FormControl>
                                    <Input {...field} className="h-8 font-bold" readOnly={isReadOnly} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <FormField control={control} name={`abilities.${index}.level`} render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Nível</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Novato">Novato</SelectItem>
                                        <SelectItem value="Adepto">Adepto</SelectItem>
                                        <SelectItem value="Mestre">Mestre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        
                        <FormField control={control} name={`abilities.${index}.type`} render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Habilidade">Habilidade</SelectItem>
                                        <SelectItem value="Poder">Poder Místico</SelectItem>
                                        <SelectItem value="Ritual">Ritual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <FormField control={control} name={`abilities.${index}.associatedAttribute`} render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Atributo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                    <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Nenhum">Nenhum</SelectItem>
                                        <Separator />
                                        {attributesList.map((attr) => (<SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        
                        <FormField control={control} name={`abilities.${index}.corruptionCost`} render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-purple-500 uppercase font-bold">Corrupção</FormLabel>
                                <FormControl>
                                    <Input placeholder="1d4" {...field} className="h-8 text-xs" readOnly={isReadOnly} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={control} name={`abilities.${index}.description`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Regras & Efeitos</FormLabel>
                            <div className="min-h-[100px] border rounded-md bg-background text-sm">
                                {isReadOnly ? (
                                    <div className="p-2"><JournalRenderer content={field.value} /></div>
                                ) : (
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Descrição..." className="min-h-[100px] border-none shadow-none text-xs" />
                                )}
                            </div>
                        </FormItem>
                    )} />

                    {!isReadOnly && (
                        <Button variant="destructive" size="sm" className="w-full mt-4 h-7 text-xs" onClick={() => remove(index)}>
                            <Trash2 className="w-3 h-3 mr-2" /> Remover
                        </Button>
                    )}
                </div>
            )}
        </Card>
    );
};