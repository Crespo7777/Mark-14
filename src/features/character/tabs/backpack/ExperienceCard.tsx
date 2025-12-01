import { useCharacterSheet } from "../../CharacterSheetContext";
import { useCharacterCalculations } from "../../hooks/useCharacterCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus, Minus } from "lucide-react";

export const ExperienceCard = () => {
  const { form, isReadOnly } = useCharacterSheet();
  
  // Hook otimizado: atualiza sempre que XP muda
  const { currentExperience } = useCharacterCalculations();

  // Watch local para feedback instantâneo nos inputs
  const totalXp = form.watch("experience.total");
  const spentXp = form.watch("experience.spent");

  // Função auxiliar para ajuste rápido
  const adjustValue = (field: string, delta: number) => {
      const current = Number(form.getValues(field)) || 0;
      const newValue = Math.max(0, current + delta);
      form.setValue(field, newValue, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <Card className="border-t-4 border-t-yellow-500 shadow-sm flex flex-col h-full">
      <CardHeader className="py-3 px-4 bg-muted/20 pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-yellow-600"/> Experiência
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 space-y-4 flex-1 flex flex-col justify-center">
        {/* XP DISPONÍVEL (Destaque Visual) */}
        <div className="text-center bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
            <span className="block text-3xl font-black text-yellow-700 dark:text-yellow-400 leading-none">
                {currentExperience}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Disponível
            </span>
        </div>

        {/* INPUTS DE EDIÇÃO (Com botões +/- para facilitar) */}
        <div className="grid grid-cols-2 gap-3">
            
            {/* TOTAL */}
            <FormField control={form.control} name="experience.total" render={({ field }) => (
                <FormItem className="space-y-0 text-center">
                    <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Total Ganho</FormLabel>
                    <div className="flex items-center gap-1">
                        {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => adjustValue("experience.total", -1)}><Minus className="w-3 h-3"/></Button>}
                        <FormControl>
                            <Input 
                                type="number" 
                                className="h-7 text-xs text-center font-bold" 
                                {...field} 
                                // O segredo da responsividade: onChange direto com valueAsNumber
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                readOnly={isReadOnly}
                            />
                        </FormControl>
                        {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => adjustValue("experience.total", 1)}><Plus className="w-3 h-3"/></Button>}
                    </div>
                </FormItem>
            )}/>

            {/* GASTO */}
            <FormField control={form.control} name="experience.spent" render={({ field }) => (
                <FormItem className="space-y-0 text-center">
                    <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Total Gasto</FormLabel>
                    <div className="flex items-center gap-1">
                        {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => adjustValue("experience.spent", -1)}><Minus className="w-3 h-3"/></Button>}
                        <FormControl>
                            <Input 
                                type="number" 
                                className="h-7 text-xs text-center font-bold text-muted-foreground" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                readOnly={isReadOnly}
                            />
                        </FormControl>
                        {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => adjustValue("experience.spent", 1)}><Plus className="w-3 h-3"/></Button>}
                    </div>
                </FormItem>
            )}/>
        </div>
      </CardContent>
    </Card>
  );
};