import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="text-purple-500" /> Corrupção</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField control={form.control} name={tempField} render={({ field }) => (
            <FormItem>
                <FormLabel>Temporária</FormLabel>
                <FormControl><Input type="number" className="text-2xl font-bold h-12" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly}/></FormControl>
            </FormItem>
        )}/>
        <div className="flex justify-between items-center text-sm pt-2">
          <span className="text-muted-foreground">Limiar de Corrupção:</span>
          <span className="font-medium text-lg">{threshold}</span>
        </div>
        <FormField control={form.control} name={permField} render={({ field }) => (
            <FormItem>
                <FormLabel>Permanente</FormLabel>
                <FormControl><Input type="number" className="h-9" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly}/></FormControl>
            </FormItem>
        )}/>
      </CardContent>
    </Card>
  );
};