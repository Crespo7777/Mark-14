import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sword } from "lucide-react";

export const StrikesSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "strikes",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
         <h3 className="font-bold flex items-center gap-2"><Sword className="w-5 h-5 text-orange-500"/> Ataques (Strikes)</h3>
         {!isReadOnly && (
             <Button size="sm" onClick={() => append({ name: "Novo Ataque", bonus: 0, damage: "1d8", traits: "" })} className="gap-2">
                 <Plus className="w-4 h-4"/> Adicionar
             </Button>
         )}
      </div>

      {fields.length === 0 && (
          <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum ataque configurado.
          </div>
      )}

      <div className="grid grid-cols-1 gap-3">
          {fields.map((field, index) => (
              <Card key={field.id} className="p-3 bg-card border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-center mb-2 gap-2">
                      <Input 
                        {...register(`strikes.${index}.name`)} 
                        placeholder="Nome da Arma (ex: Espada Longa)" 
                        className="font-bold border-none p-0 h-auto focus-visible:ring-0 text-lg" 
                        readOnly={isReadOnly}
                      />
                      {!isReadOnly && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Bônus</label>
                          <Input {...register(`strikes.${index}.bonus`)} placeholder="+0" className="h-9 font-mono" readOnly={isReadOnly}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Dano</label>
                          <Input {...register(`strikes.${index}.damage`)} placeholder="1d8+4 S" className="h-9 font-mono" readOnly={isReadOnly}/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Traits</label>
                          <Input {...register(`strikes.${index}.traits`)} placeholder="Agile, Finesse..." className="h-9" readOnly={isReadOnly}/>
                      </div>
                  </div>
              </Card>
          ))}
      </div>
    </div>
  );
};