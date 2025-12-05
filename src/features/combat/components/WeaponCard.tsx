import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sword, Dices, Settings2, Trash2, Crosshair, Zap } from "lucide-react";
import { FormField, FormLabel } from "@/components/ui/form";
import { attributesList } from "@/features/character/character.constants";
import { QualitySelector } from "@/components/QualitySelector";

interface WeaponCardProps {
  index: number;
  onAttack: () => void;
  onDamage: () => void;
  onRemove: () => void;
  projectiles: any[];
  tableId: string;
}

export const WeaponCard = ({ index, onAttack, onDamage, onRemove, projectiles, tableId }: WeaponCardProps) => {
  const { control, watch } = useFormContext();
  const [isEditing, setIsEditing] = useState(false);

  const name = watch(`weapons.${index}.name`);
  const damage = watch(`weapons.${index}.damage`);
  const attrKey = watch(`weapons.${index}.attackAttribute`);
  const attrLabel = attributesList.find(a => a.key === attrKey)?.label.substring(0, 3).toUpperCase() || "ATR";
  const projId = watch(`weapons.${index}.projectileId`);
  const linkedProjectile = projectiles.find((p: any) => p.id === projId);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card to-secondary/10 border shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-3">
        {/* Cabeçalho: Nome e Configurações */}
        <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-base truncate leading-tight" title={name}>{name}</span>
                <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1 h-4 font-mono">{attrLabel}</Badge>
                    {linkedProjectile && (
                        <Badge variant={linkedProjectile.quantity > 0 ? "outline" : "destructive"} className="text-[10px] px-1 h-4 gap-1">
                            <Crosshair className="w-2 h-2" /> {linkedProjectile.quantity}
                        </Badge>
                    )}
                </div>
            </div>

            <Popover open={isEditing} onOpenChange={setIsEditing}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 -mr-1">
                        <Settings2 className="w-3.5 h-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                    <div className="space-y-3">
                        <h4 className="font-medium text-xs uppercase text-muted-foreground">Editar Arma</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <FormField control={control} name={`weapons.${index}.name`} render={({ field }) => (<div><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs"/></div>)}/>
                            <FormField control={control} name={`weapons.${index}.damage`} render={({ field }) => (<div><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs"/></div>)}/>
                        </div>
                        
                        <FormField control={control} name={`weapons.${index}.attackAttribute`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Atributo de Ataque</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {attributesList.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}/>

                        <FormField control={control} name={`weapons.${index}.projectileId`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Munição</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma (Melee)</SelectItem>
                                        {projectiles.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}/>

                        <FormField control={control} name={`weapons.${index}.quality`} render={({ field }) => (
                            <div>
                                <FormLabel className="text-[10px]">Qualidades</FormLabel>
                                <QualitySelector tableId={tableId} value={field.value} onChange={(val) => field.onChange(val)} targetType="weapon" />
                            </div>
                        )}/>

                        <Button variant="destructive" size="sm" className="w-full h-7 text-xs mt-2" onClick={onRemove}>
                            <Trash2 className="w-3 h-3 mr-2" /> Excluir Arma
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        {/* Display de Dano */}
        <div className="flex items-center justify-center py-2 bg-muted/30 rounded-md mb-3 border border-border/50">
            <Sword className="w-4 h-4 text-orange-500 mr-2 opacity-70" />
            <span className="text-xl font-black text-foreground tracking-tight">{damage || "1d4"}</span>
        </div>

        {/* Botões de Ação Separados */}
        <div className="grid grid-cols-2 gap-2">
            <Button 
                variant="outline" 
                size="sm"
                className="h-9 hover:bg-primary/10 hover:text-primary border-primary/20"
                onClick={onAttack}
            >
                <Dices className="w-4 h-4 mr-1.5" /> 
                <span className="font-bold text-xs uppercase">Atacar</span>
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="h-9 hover:bg-orange-500/10 hover:text-orange-600 border-orange-500/20"
                onClick={onDamage}
            >
                <Zap className="w-4 h-4 mr-1.5" /> 
                <span className="font-bold text-xs uppercase">Dano</span>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};