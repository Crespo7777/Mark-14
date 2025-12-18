import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
// IMPORTAÇÃO CORRIGIDA
import { ARMOR_SUBCATEGORIES } from "@/features/systems/symbaroum/master/database.constants";

export const ArmorFormFields = ({ data, tableId, updateData }: any) => {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Classe de Armadura" /></SelectTrigger>
                    <SelectContent>
                        {ARMOR_SUBCATEGORIES.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Proteção</Label>
                    <Input 
                        placeholder="Ex: 1d4" 
                        value={data.protection || ""} 
                        onChange={e => updateData('protection', e.target.value)} 
                        className="bg-background"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Penalidade</Label>
                    <Input 
                        placeholder="Ex: 2" 
                        type="number"
                        value={data.obstructive || ""} 
                        onChange={e => updateData('obstructive', e.target.value)} 
                        className="bg-background"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Qualidades</Label>
                <QualitySelector 
                    tableId={tableId} 
                    value={data.quality || ""} 
                    onChange={(val) => updateData('quality', val)} 
                    targetType="armor"
                />
            </div>
        </div>
    );
};