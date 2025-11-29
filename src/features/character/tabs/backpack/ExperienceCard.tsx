import { useCharacterSheet } from "../../CharacterSheetContext";
import { useCharacterCalculations } from "../../hooks/useCharacterCalculations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";

export const ExperienceCard = () => {
  const { form } = useCharacterSheet();
  const { currentExperience } = useCharacterCalculations();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4"/> Experiência</CardTitle>
        <CardDescription className="text-xs">XP Disponível: <span className="text-accent font-bold">{currentExperience}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="experience.total" render={({ field }) => (
                <FormItem><FormLabel>Total Ganho</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
            )}/>
            <FormField control={form.control} name="experience.spent" render={({ field }) => (
                <FormItem><FormLabel>Total Gasto</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
            )}/>
        </div>
      </CardContent>
    </Card>
  );
};