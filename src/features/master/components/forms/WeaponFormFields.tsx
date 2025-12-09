import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QualitySelector } from "@/components/QualitySelector";
import { RPG_ATTRIBUTES, WEAPON_SUBCATEGORIES } from "../../database.constants";

interface WeaponFormFieldsProps {
  data: any;
  tableId: string;
  updateData: (key: string, value: any) => void;
}

export const WeaponFormFields = ({ data, tableId, updateData }: WeaponFormFieldsProps) => {
  const isReloadable = data.subcategory === "Arma de Projétil" || data.subcategory === "Arma de Arremesso";

  return (
    <div className="grid grid-cols-2 gap-3">
        <Select value={data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
            <SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
                {WEAPON_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}
            </SelectContent>
        </Select>
        
        <Input 
            placeholder="Dano (ex: 1d8)" 
            value={data.damage || ""} 
            onChange={e => updateData('damage', e.target.value)} 
            className="bg-background"
        />
        
        <Select value={data.attackAttribute || ""} onValueChange={v => updateData('attackAttribute', v)}>
           <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo de Ataque" /></SelectTrigger>
           <SelectContent>
               {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
           </SelectContent>
        </Select>

        <div className="col-span-2">
            <Label className="text-xs">Qualidades</Label>
            <QualitySelector 
                tableId={tableId} 
                value={data.quality || ""} 
                onChange={(val) => updateData('quality', val)} 
                targetType="weapon" 
            />
        </div>
        
        {isReloadable && (
            <Input 
                placeholder="Recarga (ex: Ação Livre)" 
                value={data.reloadAction || ""} 
                onChange={e => updateData('reloadAction', e.target.value)} 
                className="bg-background col-span-2 md:col-span-1 border-accent/50"
            />
        )}
        
        <Input 
            placeholder="Preço" 
            value={data.price || ""} 
            onChange={e => updateData('price', e.target.value)} 
            className={`${isReloadable ? "col-span-2 md:col-span-1" : "col-span-2"} bg-background`}
        />
    </div>
  );
};