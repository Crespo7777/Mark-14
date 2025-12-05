import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, AlertOctagon } from "lucide-react"; // Adicionei AlertOctagon para variar o ícone se quiseres
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface CorruptionCardProps {
  form: UseFormReturn<any>;
  threshold: number;
  tempField?: string;
  permField?: string;
  isReadOnly?: boolean;
}

export const CorruptionCard = ({ 
  form, 
  threshold, 
  tempField = "corruption.temporary", 
  permField = "corruption.permanent",
  isReadOnly 
}: CorruptionCardProps) => {
  return (
    // ADICIONADO: border-t-4 border-t-purple-500
    <Card className="border-t-4 border-t-purple-500 shadow-sm bg-gradient-to-b from-card to-purple-500/5">
      <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
        <CardTitle className="flex justify-between items-center text-base">
            <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500 fill-current" /> Corrupção
            </span>
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground bg-background/50 px-2 py-1 rounded border">
                <AlertOctagon className="w-3 h-3" />
                Limiar: <span className="font-bold text-foreground">{threshold}</span>
            </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {/* Temporária (Destaque Principal) */}
        <FormField control={form.control} name={tempField} render={({ field }) => (
            <FormItem className="space-y-1">
                <FormLabel className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Temporária</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Input 
                            type="number" 
                            className="text-3xl font-black h-12 text-center bg-purple-500/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 focus-visible:ring-purple-500" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value)} 
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormControl>
            </FormItem>
        )}/>

        {/* Permanente (Menor) */}
        <div className="pt-2 border-t border-dashed border-purple-200 dark:border-purple-800/50">
            <FormField control={form.control} name={permField} render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel className="text-xs font-medium">Permanente</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            className="h-8 w-20 text-center font-bold" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value)} 
                            readOnly={isReadOnly}
                        />
                    </FormControl>
                </FormItem>
            )}/>
        </div>
      </CardContent>
    </Card>
  );
};