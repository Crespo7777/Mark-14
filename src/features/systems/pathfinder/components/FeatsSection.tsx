import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const FeatsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { control, register, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "feats",
  });

  const FeatGroup = ({ title, typeFilter, defaultLevel = 1, colorClass }: { title: string, typeFilter: string, defaultLevel?: number, colorClass: string }) => {
    // Filtra os talentos pelo tipo (ex: 'Ancestry')
    const filteredFeats = fields
        .map((field, index) => ({ ...field, index }))
        .filter((feat: any) => feat.type === typeFilter);

    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between border-b pb-2 mb-4 border-border/40">
            <h3 className={`text-lg font-bold uppercase tracking-wide ${colorClass}`}>
                {title}
            </h3>
            {!isReadOnly && (
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => append({ name: "Novo Talento", type: typeFilter, level: defaultLevel, description: "" })} 
                    className="h-8 text-xs font-bold hover:bg-muted/50"
                >
                    <Plus className="w-3 h-3 mr-1"/> Adicionar
                </Button>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredFeats.length === 0 && (
                <div className="py-6 border-2 border-dashed border-muted rounded-xl text-center text-muted-foreground text-sm bg-muted/5">
                    Nenhum talento registrado nesta secção.
                </div>
            )}
            
            {filteredFeats.map((feat) => (
                <Card key={feat.id} className="bg-card border-border/60 shadow-sm group overflow-hidden">
                    <div className="flex items-start p-3 gap-3">
                        {/* Nível Badge - Estilo Quadrado Sólido como na imagem */}
                        <div className={`flex flex-col items-center justify-center w-10 h-10 rounded shadow-sm shrink-0 text-white font-bold ${colorClass.replace('text-', 'bg-').replace('700', '600')}`}>
                            <span className="text-sm">{watch(`feats.${feat.index}.level`) || 1}º</span>
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex gap-2">
                                <Input 
                                    {...register(`feats.${feat.index}.name`)} 
                                    className="font-bold text-base h-8 border-transparent bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50" 
                                    placeholder="Nome do Talento" 
                                    readOnly={isReadOnly}
                                />
                                {!isReadOnly && (
                                    <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Input 
                                            type="number" 
                                            {...register(`feats.${feat.index}.level`)} 
                                            className="w-12 h-7 text-center text-[10px] bg-muted/20 border-none" 
                                            title="Nível"
                                        />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => remove(feat.index)}>
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Textarea 
                                {...register(`feats.${feat.index}.description`)} 
                                className="flex-1 min-h-[60px] text-sm resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-muted-foreground leading-relaxed" 
                                placeholder="Descrição do efeito..." 
                                readOnly={isReadOnly}
                            />
                            
                            {/* Seletor de Tipo (apenas para debug ou correção, escondido por padrão se readonly) */}
                            {!isReadOnly && (
                                <div className="flex justify-end pt-1">
                                    <Select onValueChange={(v) => setValue(`feats.${feat.index}.type`, v)} defaultValue={typeFilter}>
                                        <SelectTrigger className="h-5 w-auto min-w-[80px] text-[9px] border-none bg-muted/10 text-muted-foreground px-2"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ancestry">Ancestralidade</SelectItem>
                                            <SelectItem value="Class">Classe</SelectItem>
                                            <SelectItem value="General">Geral</SelectItem>
                                            <SelectItem value="Skill">Perícia</SelectItem>
                                            <SelectItem value="Bonus">Bônus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 max-w-5xl mx-auto pb-10">
        <FeatGroup title="Habilidades de Ancestralidade" typeFilter="Ancestry" colorClass="text-amber-700" defaultLevel={1} />
        <FeatGroup title="Habilidades de Classe" typeFilter="Class" colorClass="text-blue-700" defaultLevel={1} />
        <FeatGroup title="Talentos Gerais" typeFilter="General" colorClass="text-slate-700" defaultLevel={3} />
        <FeatGroup title="Talentos de Perícia" typeFilter="Skill" colorClass="text-emerald-700" defaultLevel={2} />
        <FeatGroup title="Talentos Bônus" typeFilter="Bonus" colorClass="text-purple-700" defaultLevel={1} />
    </div>
  );
};