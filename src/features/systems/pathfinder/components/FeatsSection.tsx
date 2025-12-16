import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GraduationCap, Zap, Scroll, Award, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FeatsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "feats" });

  const addFeat = (type: string) => {
    append({ name: "Novo Talento", type, level: 1, description: "" });
  };

  const FeatGroup = ({ title, type, icon: Icon, color }: any) => {
    // IMPORTANTE: type deve ser minúsculo para bater com o Schema (ancestry, class, etc)
    const featList = fields.map((f, i) => ({ ...f, index: i })).filter((f: any) => f.type === type);

    return (
      <Card className={`border-t-4 ${color} shadow-sm mb-6`}>
        <div className="p-4 border-b border-border/10 flex justify-between items-center bg-card">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
            <Icon className="w-5 h-5 opacity-70" /> {title}
          </h3>
          {!isReadOnly && (
            <Button variant="ghost" size="sm" onClick={() => addFeat(type)} className="text-xs h-7 border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5">
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          )}
        </div>
        <CardContent className="p-2">
           <Accordion type="single" collapsible className="space-y-2">
             {featList.length === 0 && (
               <div className="text-center py-6 text-muted-foreground text-xs italic bg-muted/5 rounded-lg border border-dashed border-muted">
                 Nenhum talento de {title.toLowerCase()} registrado.
               </div>
             )}
             {featList.map((feat) => (
               <AccordionItem key={feat.id} value={feat.id} className="border rounded-lg bg-background px-2 data-[state=open]:bg-accent/5 transition-colors">
                 <div className="flex items-center gap-2 py-2">
                   {/* Input de Nome */}
                   <Input 
                     {...register(`feats.${feat.index}.name`)} 
                     className="h-8 font-bold border-transparent bg-transparent focus-visible:ring-0 flex-1 px-0 text-sm hover:bg-muted/10 transition-colors rounded-sm px-2"
                     placeholder="Nome do Talento"
                     readOnly={isReadOnly}
                   />
                   
                   {/* Input de Nível */}
                   <div className="relative">
                       <span className="absolute -top-2 -left-1 text-[8px] font-bold text-muted-foreground uppercase bg-background px-1">Lvl</span>
                       <Input 
                         type="number"
                         {...register(`feats.${feat.index}.level`)} 
                         className="h-8 w-10 text-center text-xs bg-muted/20 border-none font-bold"
                         title="Nível do Talento"
                         readOnly={isReadOnly}
                       />
                   </div>

                   <AccordionTrigger className="w-6 h-8 p-0 hover:no-underline" />
                   
                   {!isReadOnly && (
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => remove(feat.index)}>
                       <Trash2 className="w-3.5 h-3.5" />
                     </Button>
                   )}
                 </div>
                 <AccordionContent className="pb-3 pt-0 px-2">
                    <Textarea 
                      {...register(`feats.${feat.index}.description`)}
                      className="text-xs min-h-[80px] bg-muted/10 resize-y border-dashed border-muted focus:border-primary/30"
                      placeholder="Descrição do efeito, pré-requisitos, gatilhos..."
                      readOnly={isReadOnly}
                    />
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passando os tipos em minúsculo para bater com o Schema */}
        <FeatGroup title="Ancestralidade" type="ancestry" icon={Crown} color="border-t-amber-600" />
        <FeatGroup title="Classe" type="class" icon={Award} color="border-t-blue-600" />
        <FeatGroup title="Geral" type="general" icon={Zap} color="border-t-slate-600" />
        <FeatGroup title="Perícia" type="skill" icon={GraduationCap} color="border-t-emerald-600" />
      </div>
      
      {/* BÔNUS / OUTROS */}
      <Card className="border-t-4 border-t-purple-600 shadow-sm">
         <div className="p-4 border-b flex justify-between items-center bg-card">
             <h3 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
               <Scroll className="w-5 h-5 opacity-70" /> Habilidades Especiais & Bônus
             </h3>
             {!isReadOnly && (
               <Button variant="ghost" size="sm" onClick={() => addFeat("bonus")} className="text-xs h-7 border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5">
                 <Plus className="w-3 h-3 mr-1" /> Adicionar
               </Button>
             )}
         </div>
         <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* Filtro por "bonus" minúsculo */}
             {fields.map((f, i) => f.type === "bonus" && (
                <div key={f.id} className="p-3 rounded-lg border bg-card shadow-sm group hover:border-purple-300 transition-colors">
                   <div className="flex justify-between mb-2 items-start">
                      <Input {...register(`feats.${i}.name`)} className="h-7 font-bold border-none p-0 text-sm focus-visible:ring-0 bg-transparent" placeholder="Nome da Habilidade" readOnly={isReadOnly}/>
                      {!isReadOnly && <Trash2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer hover:text-red-500 transition-opacity" onClick={() => remove(i)}/>}
                   </div>
                   <Textarea {...register(`feats.${i}.description`)} className="text-xs min-h-[60px] bg-muted/10 resize-none border-transparent focus:bg-background" placeholder="Descrição..." readOnly={isReadOnly}/>
                </div>
             ))}
             {fields.filter(f => f.type === "bonus").length === 0 && (
                <div className="col-span-full text-center py-4 text-muted-foreground text-xs italic">Nenhuma habilidade bônus.</div>
             )}
         </CardContent>
      </Card>
    </div>
  );
};