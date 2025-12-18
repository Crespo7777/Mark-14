import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// IMPORTAÇÃO CORRIGIDA
import { RPG_ATTRIBUTES } from "@/features/systems/symbaroum/master/database.constants";

export const AbilityFormFields = ({ data, updateData }: any) => {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={data.type || "Habilidade"} onValueChange={v => updateData('type', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Habilidade">Habilidade</SelectItem>
                            <SelectItem value="Poder">Poder Místico</SelectItem>
                            <SelectItem value="Ritual">Ritual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Atributo (Opcional)</Label>
                    <Select value={data.associatedAttribute || "none"} onValueChange={v => updateData('associatedAttribute', v === 'none' ? '' : v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {RPG_ATTRIBUTES.map(attr => (
                                <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Tradição</Label>
                    <Input 
                        placeholder="Ex: Teurgia" 
                        value={data.tradition || ""} 
                        onChange={e => updateData('tradition', e.target.value)} 
                        className="bg-background"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Custo Corrupção</Label>
                    <Input 
                        placeholder="Ex: 1d4" 
                        value={data.corruptionCost || ""} 
                        onChange={e => updateData('corruptionCost', e.target.value)} 
                        className="bg-background"
                    />
                </div>
            </div>

            <div className="space-y-2 border-t pt-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Efeitos por Nível</Label>
                <div className="space-y-2">
                    <Textarea 
                        placeholder="Efeito Novato..." 
                        className="h-16 bg-background"
                        value={data.novice || ""}
                        onChange={e => updateData('novice', e.target.value)}
                    />
                    <Textarea 
                        placeholder="Efeito Adepto..." 
                        className="h-16 bg-background"
                        value={data.adept || ""}
                        onChange={e => updateData('adept', e.target.value)}
                    />
                    <Textarea 
                        placeholder="Efeito Mestre..." 
                        className="h-16 bg-background"
                        value={data.master || ""}
                        onChange={e => updateData('master', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};