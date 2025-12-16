import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Zap, Hourglass, ShieldAlert, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ActionsTab = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { control, register, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "actions" });

  const addAction = () => append({ name: "Nova Ação", type: "action", actions: "1", description: "", traits: "" });

  const ActionIcon = ({ type, count }: { type: string, count?: string }) => {
      if (type === "reaction") return <RotateCcw className="w-4 h-4 text-orange-500 rotate-180"/>;
      if (type === "free") return <span className="font-black text-xs border border-current px-1 rounded text-muted-foreground">Livre</span>;
      if (type === "passive") return <span className="font-black text-xs border border-current px-1 rounded text-blue-500">Passiva</span>;
      
      // Renderiza losangos para ações (1 a 3)
      const num = parseInt(count || "1");
      return (
        <div className="flex gap-0.5">
            {Array.from({length: num}).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-primary rotate-45 rounded-[1px]" />
            ))}
        </div>
      );
  };

  return (
    <div className="space-y-4 animate-in fade-in">
        <div className="flex justify-between items-center p-2 bg-muted/10 rounded-lg border border-primary/10">
            <h3 className="font-bold text-primary flex items-center gap-2"><Zap className="w-5 h-5"/> Ações & Atividades</h3>
            {!isReadOnly && <Button size="sm" onClick={addAction}><Plus className="w-4 h-4 mr-1"/> Adicionar</Button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                    Nenhuma ação registrada.
                </div>
            )}

            {fields.map((field, index) => {
                const type = watch(`actions.${index}.type`);
                const actionsCount = watch(`actions.${index}.actions`);

                return (
                <Card key={field.id} className="p-3 border-l-4 border-l-primary/40 bg-card group relative overflow-hidden">
                    <div className="flex items-start gap-3">
                        {/* Seletor de Tipo Compacto */}
                        <div className="w-16 flex flex-col items-center gap-1 pt-1">
                             <div className="h-8 flex items-center justify-center">
                                 <ActionIcon type={type} count={actionsCount}/>
                             </div>
                             {!isReadOnly && (
                                 <Select onValueChange={(v) => setValue(`actions.${index}.type`, v)} defaultValue={type}>
                                     <SelectTrigger className="h-6 text-[10px] px-1 w-full text-center"><SelectValue/></SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="action">Ação</SelectItem>
                                         <SelectItem value="reaction">Reação</SelectItem>
                                         <SelectItem value="free">Livre</SelectItem>
                                         <SelectItem value="passive">Passiva</SelectItem>
                                     </SelectContent>
                                 </Select>
                             )}
                             {!isReadOnly && type === 'action' && (
                                 <Select onValueChange={(v) => setValue(`actions.${index}.actions`, v)} defaultValue={actionsCount}>
                                     <SelectTrigger className="h-6 text-[10px] px-1 w-full text-center bg-muted/20"><SelectValue/></SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="1">1 Ação</SelectItem>
                                         <SelectItem value="2">2 Ações</SelectItem>
                                         <SelectItem value="3">3 Ações</SelectItem>
                                     </SelectContent>
                                 </Select>
                             )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 space-y-1">
                            <Input 
                                {...register(`actions.${index}.name`)} 
                                className="h-7 font-bold text-base bg-transparent border-transparent px-0 focus-visible:ring-0" 
                                placeholder="Nome da Ação" 
                                readOnly={isReadOnly}
                            />
                            <Input 
                                {...register(`actions.${index}.traits`)} 
                                className="h-5 text-[10px] bg-muted/20 border-none rounded-full px-2 text-muted-foreground w-full" 
                                placeholder="Traits (ex: Auditory, Attack)" 
                                readOnly={isReadOnly}
                            />
                            <Textarea 
                                {...register(`actions.${index}.description`)} 
                                className="min-h-[60px] text-xs resize-none bg-transparent border-dashed border-border/50 p-1 text-muted-foreground focus-visible:ring-0" 
                                placeholder="Descrição..." 
                                readOnly={isReadOnly}
                            />
                        </div>

                        {!isReadOnly && (
                            <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-muted-foreground/50 hover:text-red-500 absolute top-2 right-2">
                                <Trash2 className="w-3 h-3"/>
                            </Button>
                        )}
                    </div>
                </Card>
            )})}
        </div>
    </div>
  );
};