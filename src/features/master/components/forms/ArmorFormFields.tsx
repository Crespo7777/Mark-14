import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QualitySelector } from "@/components/QualitySelector";
import { ARMOR_SUBCATEGORIES } from "../../database.constants";

interface ArmorFormFieldsProps {
  data: any;
  tableId: string;
  updateData: (key: string, value: any) => void;
}

export const ArmorFormFields = ({ data, tableId, updateData }: ArmorFormFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
        <Select value={data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
            <SelectTrigger className="col-span-2 bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
                {ARMOR_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}
            </SelectContent>
        </Select>
        
        <Input 
            placeholder="Proteção (ex: 1d4 ou 2)" 
            value={data.protection || ""} 
            onChange={e => updateData('protection', e.target.value)} 
            className="bg-background"
        />
        
        <Input 
            placeholder="Penalidade (ex: 2)" 
            value={data.obstructive || ""} 
            onChange={e => updateData('obstructive', e.target.value)} 
            className="bg-background"
        />
        
        <div className="col-span-2">
            <Label className="text-xs">Qualidades</Label>
            <QualitySelector 
                tableId={tableId} 
                value={data.quality || ""} 
                onChange={(val) => updateData('quality', val)} 
                targetType="armor" 
            />
        </div>
        
        <Input 
            placeholder="Preço" 
            className="col-span-2 bg-background" 
            value={data.price || ""} 
            onChange={e => updateData('price', e.target.value)} 
        />
    </div>
  );
};