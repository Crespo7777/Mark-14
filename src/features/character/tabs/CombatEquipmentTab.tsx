import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, Sword, Dices, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { useEquipmentManager } from "../hooks/useEquipmentManager";
import { getDefaultWeapon, getDefaultArmor } from "../character.schema";
import { attributesList } from "../character.constants";
import { useTableContext } from "@/features/table/TableContext";

// Dialogs e Componentes
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { DefenseRollDialog } from "@/components/DefenseRollDialog";
import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";
import { QualitySelector } from "@/components/QualitySelector";
import { QualityInfoButton } from "@/components/QualityInfoButton";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";

export const CombatEquipmentTab = () => {
  const { form, character } = useCharacterSheet();
  const { setValue } = useFormContext();
  const { tableId } = useTableContext();
  
  // hook de calculos já otimizado (não re-renderiza com HP atual)
  const { toughnessMax, painThreshold, activeBerserk, totalDefense, corruptionThreshold } = useCharacterCalculations();

  const combatLogic = useCombatLogic({ 
      form, 
      fields: { currentToughness: "toughness.current", maxToughness: "toughness.max" }
  });

  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openArmors, setOpenArmors] = useState<string[]>([]);
  
  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });
  
  const projectiles = form.watch("projectiles") || [];

  const onDamage = (val: number) => combatLogic.handleDamage(val);
  const onHeal = (val: number) => combatLogic.handleHeal(val, toughnessMax);

  return (
    <div className="space-y-4 h-full flex flex-col">
      
      {/* --- DASHBOARD SUPERIOR (3 COLUNAS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* COLUNA 1: DEFESA */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
             <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> Defesa</CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                 <div className="text-5xl font-extrabold text-foreground tracking-tighter">{totalDefense}</div>
                 <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => combatLogic.setIsDefenseRollOpen(true)}>
                    <Dices className="w-4 h-4" /> Rolar Defesa
                 </Button>
                 <div className="text-xs text-muted-foreground text-center px-2">
                    (Rápido - Penalidade de Armadura)<br/>
                    <span className="opacity-70">Escudos: Use valor negativo em "Obstrutiva"</span>
                 </div>
             </CardContent>
          </Card>

          {/* COLUNA 2: VITALIDADE */}
          <VitalityCard 
            form={form}
            max={toughnessMax}
            painThreshold={painThreshold}
            onDamage={onDamage}
            onHeal={onHeal}
          />

          {/* COLUNA 3: CORRUPÇÃO */}
          <CorruptionCard 
            form={form} 
            threshold={corruptionThreshold} 
          />
      </div>

      {/* --- ÁREA DE EQUIPAMENTO (2 COLUNAS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          
          {/* PAINEL DE ARMAS */}
          <Card className="flex flex-col border-t-4 border-t-orange-500 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Sword className="w-4 h-4 text-orange-500" /> Armas</CardTitle>
                <ItemSelectorDialog tableId={tableId} categories={['weapon']} onSelect={(template) => {
                    if (template) {
                        const quality = template.data.quality || "";
                        const desc = template.description || template.data.quality_desc || "";
                        appendWeapon({ ...getDefaultWeapon(), name: template.name, damage: template.data.damage || "", attackAttribute: template.data.attackAttribute || "", quality: quality, quality_desc: desc, weight: template.weight || 1 });
                    } else {
                        appendWeapon(getDefaultWeapon());
                    }
                }}>
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="w-4 h-4" /></Button>
                </ItemSelectorDialog>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                {weaponFields.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">Sem armas equipadas</div>}
                <Accordion type="multiple" className="space-y-2" value={openWeapons} onValueChange={setOpenWeapons}>
                    {weaponFields.map((field, index) => {
                        const currentProjectileId = form.watch(`weapons.${index}.projectileId`);
                        const linkedProjectile = projectiles.find((p: any) => p.id === currentProjectileId);
                        
                        return (
                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                            <div className="flex items-center justify-between py-2">
                                <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                    <div className="flex flex-col items-start text-left gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{form.watch(`weapons.${index}.name`)}</span>
                                            {linkedProjectile && (
                                                <Badge variant={linkedProjectile.quantity > 0 ? "outline" : "destructive"} className="text-[10px] h-4 px-1">
                                                    Qtd: {linkedProjectile.quantity}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-muted">{form.watch(`weapons.${index}.damage`)}</Badge>
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{attributesList.find(a => a.key === form.watch(`weapons.${index}.attackAttribute`))?.label || "?"}</Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => combatLogic.preparePcAttack(index)} title="Rolar Ataque"><Dices className="w-4 h-4 text-primary" /></Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => combatLogic.prepareDamage(index, activeBerserk ? "1d6" : "")} title="Rolar Dano"><Sword className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => removeWeapon(index)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                            <AccordionContent className="border-t pt-2">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <FormField control={form.control} name={`weapons.${index}.name`} render={({ field }) => (<div className="space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" /></div>)} />
                                    <FormField control={form.control} name={`weapons.${index}.damage`} render={({ field }) => (<div className="space-y-1"><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs" /></div>)} />
                                </div>
                                
                                <FormField control={form.control} name={`weapons.${index}.projectileId`} render={({ field }) => (
                                    <FormItem className="mb-2">
                                        <FormLabel className="text-[10px]">Munição</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                                            <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhuma (Melee)</SelectItem>
                                                {projectiles.map((p: any) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} (Qtd: {p.quantity})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name={`weapons.${index}.quality`} render={({ field }) => (
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><FormLabel className="text-[10px]">Qualidades</FormLabel><QualityInfoButton qualitiesString={field.value} tableId={tableId}/></div>
                                        <QualitySelector tableId={tableId} value={field.value} onChange={(val, desc) => { field.onChange(val); if(desc) setValue(`weapons.${index}.quality_desc`, desc, {shouldDirty:true}); }} targetType="weapon" />
                                    </div>
                                )}/>
                            </AccordionContent>
                        </AccordionItem>
                    );
                    })}
                </Accordion>
            </CardContent>
          </Card>

          {/* PAINEL DE ARMADURAS */}
          <Card className="flex flex-col border-t-4 border-t-slate-500 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" /> Armaduras</CardTitle>
                <ItemSelectorDialog tableId={tableId} categories={['armor']} onSelect={(template) => {
                    if(template) appendArmor({ ...getDefaultArmor(), name: template.name, protection: template.data.protection, obstructive: template.data.obstructive, quality: template.data.quality, quality_desc: template.description, weight: template.weight });
                    else appendArmor(getDefaultArmor());
                }}>
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="w-4 h-4" /></Button>
                </ItemSelectorDialog>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                {armorFields.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">Sem armaduras</div>}
                <Accordion type="multiple" className="space-y-2" value={openArmors} onValueChange={setOpenArmors}>
                    {armorFields.map((field, index) => (
                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                            <div className="flex items-center justify-between py-2">
                                <AccordionTrigger className="p-0 hover:no-underline flex-1">
                                    <div className="flex flex-col items-start text-left gap-1">
                                        <span className="font-semibold text-sm">{form.watch(`armors.${index}.name`)}</span>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">Prot: {form.watch(`armors.${index}.protection`)}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => removeArmor(index)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                            <AccordionContent className="border-t pt-2 space-y-2">
                                <div className="flex gap-2">
                                    <FormField control={form.control} name={`armors.${index}.protection`} render={({ field }) => (<div className="space-y-1 flex-1"><FormLabel className="text-[10px]">Proteção</FormLabel><Input {...field} className="h-7 text-xs" /></div>)} />
                                    <FormField control={form.control} name={`armors.${index}.obstructive`} render={({ field }) => (<div className="space-y-1 flex-1"><FormLabel className="text-[10px]">Obstrutiva</FormLabel><Input {...field} className="h-7 text-xs" type="number" /></div>)} />
                                </div>
                                <FormField control={form.control} name={`armors.${index}.equipped`} render={({field}) => (
                                    <div className="flex items-center gap-2 border p-2 rounded bg-muted/20 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                                        <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="rounded border-gray-300 accent-primary w-4 h-4 cursor-pointer" />
                                        <span className="text-xs font-medium cursor-pointer select-none">Item Equipado (Afeta Defesa)</span>
                                    </div>
                                )} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
          </Card>
      </div>

      {/* Dialogs Flutuantes */}
      {combatLogic.attackRollData && <WeaponAttackDialog open={!!combatLogic.attackRollData} onOpenChange={(o) => !o && combatLogic.setAttackRollData(null)} characterName={character.name} tableId={character.table_id} {...combatLogic.attackRollData} onConfirm={() => combatLogic.consumeProjectile(combatLogic.attackRollData?.projectileId)} />}
      {combatLogic.damageRollData && <WeaponDamageDialog open={!!combatLogic.damageRollData} onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} characterName={character.name} tableId={character.table_id} {...combatLogic.damageRollData} />}
      <DefenseRollDialog open={combatLogic.isDefenseRollOpen} onOpenChange={combatLogic.setIsDefenseRollOpen} defenseValue={totalDefense} characterName={character.name} tableId={character.table_id} />
    
    </div>
  );
};