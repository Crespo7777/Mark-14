import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface NpcCorruptionCardProps {
  form: UseFormReturn<any>;
}

export const NpcCorruptionCard = ({ form }: NpcCorruptionCardProps) => {
  return (
    <Card className="border-t-4 border-t-purple-500 shadow-sm bg-gradient-to-b from-card to-purple-500/5 h-full">
      <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
        <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-purple-600 font-bold text-base">
                <Shield className="w-4 h-4 fill-current" /> Corrupção
            </span>
            
            {/* INPUT MANUAL DE LIMIAR INTEGRADO */}
            <div className="flex items-center gap-2 bg-background border rounded px-2 py-1 shadow-sm">
                <span className="text-xs text-muted-foreground font-semibold">Limiar:</span>
                <FormField control={form.control} name="combat.corruption_threshold" render={({ field }) => ( 
                    <Input 
                        {...field} 
                        type="number" 
                        className="h-5 w-10 p-0 text-center border-none bg-transparent font-bold text-sm focus-visible:ring-0" 
                        placeholder="4"
                        onChange={e => field.onChange(e.target.value)}
                    />
                )}/>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        <FormField control={form.control} name="corruption.temporary" render={({ field }) => (
            <FormItem className="space-y-1 text-center">
                <FormLabel className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Temporária</FormLabel>
                <FormControl>
                    <Input type="number" className="text-4xl font-black h-16 text-center bg-purple-500/10 border-purple-200 text-purple-700 focus-visible:ring-purple-500" {...field} onChange={e => field.onChange(e.target.value)} />
                </FormControl>
            </FormItem>
        )}/>

        <div className="pt-3 border-t border-dashed border-purple-200">
            <FormField control={form.control} name="corruption.permanent" render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 bg-background/50 p-2 rounded border">
                    <FormLabel className="text-xs font-bold text-purple-900">Permanente</FormLabel>
                    <FormControl><Input type="number" className="h-7 w-16 text-center font-bold border-purple-100 focus-visible:ring-purple-400" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl>
                </FormItem>
            )}/>
        </div>
      </CardContent>
    </Card>
  );
};