import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RPG_ATTRIBUTES } from "../../database.constants";

interface AbilityFormFieldsProps {
  data: any;
  updateData: (key: string, value: any) => void;
}

export const AbilityFormFields = ({ data, updateData }: AbilityFormFieldsProps) => {
  return (
    <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <Select value={data.type || "Habilidade"} onValueChange={v => updateData('type', v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Habilidade">Habilidade</SelectItem>
                    <SelectItem value="Poder">Poder</SelectItem>
                    <SelectItem value="Ritual">Ritual</SelectItem>
                </SelectContent>
            </Select>
            
            <Input 
                placeholder="Custo Corr." 
                value={data.corruptionCost || ""} 
                onChange={e => updateData('corruptionCost', e.target.value)} 
                className="bg-background"
            />
            
            <Select value={data.associatedAttribute || ""} onValueChange={v => updateData('associatedAttribute', v)}>
               <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo Base" /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="Nenhum">Nenhum</SelectItem>
                  {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
               </SelectContent>
            </Select>

            <Input 
                placeholder="Tradição" 
                value={data.tradition || ""} 
                onChange={e => updateData('tradition', e.target.value)} 
                className="bg-background"
            />
        </div>
        
        <div className="space-y-2 border-t pt-2">
            <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
            <Textarea 
                placeholder="Novato..." 
                className="h-14 bg-background" 
                value={data.novice || ""} 
                onChange={e => updateData('novice', e.target.value)} 
            />
            <Textarea 
                placeholder="Adepto..." 
                className="h-14 bg-background" 
                value={data.adept || ""} 
                onChange={e => updateData('adept', e.target.value)} 
            />
            <Textarea 
                placeholder="Mestre..." 
                className="h-14 bg-background" 
                value={data.master || ""} 
                onChange={e => updateData('master', e.target.value)} 
            />
        </div>
    </div>
  );
};