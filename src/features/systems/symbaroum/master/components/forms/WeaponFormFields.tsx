import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
// IMPORTAÇÃO CORRIGIDA
import { RPG_ATTRIBUTES, WEAPON_SUBCATEGORIES } from "@/features/systems/symbaroum/master/database.constants";

export const WeaponFormFields = ({ data, tableId, updateData }: any) => {
    const isReloadable = data.subcategory === "Arma de Projétil" || data.subcategory === "Arma de Arremesso";

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Subcategoria</Label>
                    <Select value={data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo de Arma" /></SelectTrigger>
                        <SelectContent>
                            {WEAPON_SUBCATEGORIES.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Atributo de Ataque</Label>
                    <Select value={data.attackAttribute || ""} onValueChange={v => updateData('attackAttribute', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo" /></SelectTrigger>
                        <SelectContent>
                            {RPG_ATTRIBUTES.map(attr => (
                                <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Dano</Label>
                    <Input 
                        placeholder="Ex: 1d8" 
                        value={data.damage || ""} 
                        onChange={e => updateData('damage', e.target.value)} 
                        className="bg-background"
                    />
                </div>
                {isReloadable && (
                    <div className="space-y-1.5">
                        <Label>Recarga</Label>
                        <Input 
                            placeholder="Ação de Movimento..." 
                            value={data.reloadAction || ""} 
                            onChange={e => updateData('reloadAction', e.target.value)} 
                            className="bg-background"
                        />
                    </div>
                )}
            </div>

            <div className="space-y-1.5">
                <Label>Qualidades</Label>
                <QualitySelector 
                    tableId={tableId} 
                    value={data.quality || ""} 
                    onChange={(val) => updateData('quality', val)} 
                    targetType="weapon"
                />
            </div>
        </div>
    );
};