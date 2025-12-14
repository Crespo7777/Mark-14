import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Zap, Hourglass, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ActionsTab = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { control, register, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "actions" });

  const addAction = () => append({ name: "Nova Ação", type: "action", actions: "1", description: "" });

  const ActionIcon = ({ type }: { type: string }) => {
      if (type === "reaction") return <ShieldAlert className="w-4 h-4 text-orange-500"/>;
      if (type === "free") return <Hourglass className="w-4 h-4 text-blue-500"/>;
      return <Zap className="w-4 h-4 text-yellow-500"/>;
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center p-2 bg-muted/10 rounded-lg border border-primary/10">
            <h3 className="font-bold text-primary flex items-center gap-2"><Zap className="w-5 h-5"/> Ações & Atividades</h3>
            {!isReadOnly && <Button size="sm" onClick={addAction}><Plus className="w-4 h-4 mr-1"/> Adicionar</Button>}
        </div>

        <div className="grid grid-cols-1 gap-3">
            {fields.map((field, index) => (
                <Card key={field.id} className="p-3 border-l-4 border-l-primary/40 bg-card">
                    <div className="flex items-start gap-3">
                        {/* Tipo de Ação */}
                        <div className="w-16">
                             {isReadOnly ? (
                                 <div className="flex justify-center py-2"><ActionIcon type={watch(`actions.${index}.type`)}/></div>
                             ) : (
                                 <Select onValueChange={(v) => setValue(`actions.${index}.type`, v)} defaultValue={watch(`actions.${index}.type`) || "action"}>
                                     <SelectTrigger className="h-8 text-xs px-1"><SelectValue/></SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="action">Ação</SelectItem>
                                         <SelectItem value="reaction">Reação</SelectItem>
                                         <SelectItem value="free">Livre</SelectItem>
                                         <SelectItem value="passive">Passiva</SelectItem>
                                     </SelectContent>
                                 </Select>
                             )}
                        </div>

                        {/* Detalhes */}
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                                <Input {...register(`actions.${index}.name`)} className="h-8 font-bold bg-transparent border-transparent px-0" placeholder="Nome da Ação" readOnly={isReadOnly}/>
                                <Input {...register(`actions.${index}.actions`)} className="h-8 w-12 text-center bg-muted/20 text-xs" placeholder="Act" title="Custo de Ações (1, 2, 3)" readOnly={isReadOnly}/>
                            </div>
                            <Textarea {...register(`actions.${index}.description`)} className="min-h-[60px] text-xs resize-none bg-transparent border-none p-0 text-muted-foreground" placeholder="Descrição..." readOnly={isReadOnly}/>
                        </div>

                        {!isReadOnly && <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-muted-foreground"/></Button>}
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
};