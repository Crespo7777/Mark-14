import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Shield, Sword, Dices, ArrowDownToLine } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { useEquipmentManager } from "../hooks/useEquipmentManager";
import { attributesList } from "../character.constants";
import { getDefaultWeapon, getDefaultArmor } from "../character.schema";
import { supabase } from "@/integrations/supabase/client";
import { parseDiceRoll, formatProtectionRoll } from "@/lib/dice-parser";
import { useToast } from "@/hooks/use-toast";
import { useTableContext } from "@/features/table/TableContext";

import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";
import { DefenseRollDialog } from "@/components/DefenseRollDialog";
import { QualityInfoButton } from "@/components/QualityInfoButton";
import { QualitySelector } from "@/components/QualitySelector";

// Componentes
import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";

export const CombatEquipmentTab = () => {
  const { form, character } = useCharacterSheet();
  const { setValue } = useFormContext();
  const { tableId } = useTableContext();
  const { toast } = useToast();
  const { unequipItem } = useEquipmentManager();

  const { toughnessMax, painThreshold, activeBerserk, quick, totalDefense, corruptionThreshold } = useCharacterCalculations();

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
  const onAttack = (index: number) => combatLogic.preparePcAttack(index);
  const onDamageRoll = (index: number) => combatLogic.prepareDamage(index, activeBerserk ? "1d6" : "");

  const handleProtectionRoll = async (index: number) => {
    const armor = form.getValues(`armors.${index}`);
    let protectionString = armor.protection || "0";
    if (activeBerserk && (activeBerserk.level === 'Adepto' || activeBerserk.level === 'Mestre')) {
         protectionString += "+1d4"; 
         toast({ title: "Pele de Ferro", description: "Amoque ativo: +1d4 proteção." }); 
    }
    
    const roll = parseDiceRoll(protectionString);
    if (!roll) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        toast({ title: `Proteção: ${armor.name}`, description: `Total: ${roll.total}` });
        await supabase.from("chat_messages").insert({ table_id: character.table_id, user_id: user.id, message: formatProtectionRoll(character.name, armor.name, roll), message_type: "roll" });
        const discordRollData = { rollType: "protection", armorName: armor.name, result: roll };
        supabase.functions.invoke('discord-roll-handler', { body: { tableId: character.table_id, rollData: discordRollData, userName: character.name } }).catch(console.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <VitalityCard 
            form={form}
            currentField="toughness.current"
            max={toughnessMax}
            painThreshold={painThreshold}
            onDamage={onDamage}
            onHeal={onHeal}
            bonusField="toughness.bonus"
         />
         <CorruptionCard 
            form={form}
            threshold={corruptionThreshold}
         />
      </div>

      {/* ARMAS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Sword /> Armas</CardTitle>
          <ItemSelectorDialog tableId={tableId} categories={['weapon']} onSelect={(template) => {
              if (template) {
                  const quality = template.data.quality || "";
                  const desc = template.description || template.data.quality_desc || "";
                  appendWeapon({ ...getDefaultWeapon(), name: template.name, damage: template.data.damage || "", attackAttribute: template.data.attackAttribute || "", quality: quality, quality_desc: desc, weight: template.weight || 1 });
              } else {
                  appendWeapon(getDefaultWeapon());
              }
          }}>
              <Button type="button" size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Arma</Button>
          </ItemSelectorDialog>
        </CardHeader>
        <CardContent>
          {weaponFields.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma arma equipada.</p>}
          <Accordion type="multiple" className="space-y-4" value={openWeapons} onValueChange={setOpenWeapons}>
            {weaponFields.map((field, index) => (
              <AccordionItem key={field.id} value={field.id} className="p-3 rounded-md border bg-muted/20">
                <div className="flex justify-between items-center w-full gap-2 p-0">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex-1 flex items-center gap-2 sm:gap-4 flex-wrap text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate shrink-0">{form.watch(`weapons.${index}.name`) || "Nova Arma"}</h4>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="px-1.5 py-0.5">Dano: {form.watch(`weapons.${index}.damage`) || "N/A"}</Badge>
                        <Badge variant="outline" className="px-1.5 py-0.5">Atq: {attributesList.find((a) => a.key === form.watch(`weapons.${index}.attackAttribute`))?.label || "N/A"}</Badge>
                        
                        {/* Indicador de Munição na linha recolhida */}
                        {form.watch(`weapons.${index}.projectileId`) && form.watch(`weapons.${index}.projectileId`) !== "none" && (
                            <Badge variant={
                                (projectiles.find((p: any) => p.id === form.watch(`weapons.${index}.projectileId`))?.quantity || 0) > 0 
                                ? "default" 
                                : "destructive"
                            } className="px-1.5 py-0.5 ml-1">
                                Qtd: {projectiles.find((p: any) => p.id === form.watch(`weapons.${index}.projectileId`))?.quantity || 0}
                            </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="flex items-center gap-1 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button type="button" size="icon" variant="ghost" title="Desequipar" onClick={() => unequipItem(index, 'weapon')}><ArrowDownToLine className="w-4 h-4" /></Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => onAttack(index)}><Dices className="w-4 h-4" /><span className="hidden sm:inline ml-2">Atacar</span></Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => onDamageRoll(index)}><Dices className="w-4 h-4" /><span className="hidden sm:inline ml-2">Dano</span></Button>
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeWeapon(index)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                             <FormField control={form.control} name={`weapons.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Espada" {...field} /></FormControl></FormItem>)}/>
                             <FormField control={form.control} name={`weapons.${index}.weight`} render={({ field }) => (<FormItem className="w-24"><FormLabel>Peso</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name={`weapons.${index}.attackAttribute`} render={({ field }) => (
                                <FormItem><FormLabel>Atributo de Ataque</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{attributesList.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent></Select></FormItem>
                            )}/>
                            <FormField control={form.control} name={`weapons.${index}.damage`} render={({ field }) => (<FormItem><FormLabel>Dano</FormLabel><FormControl><Input placeholder="1d8" {...field} /></FormControl></FormItem>)}/>
                        </div>
                        
                        {/* SELETOR DE MUNIÇÃO */}
                        <FormField control={form.control} name={`weapons.${index}.projectileId`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Projétil Necessário</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum (Corpo a corpo/Inato)</SelectItem>
                                        {projectiles.length > 0 ? (
                                            projectiles.map((p: any) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name || "Sem nome"} (Qtd: {p.quantity})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="disabled" disabled>Nenhum projétil na mochila</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        
                         <FormField control={form.control} name={`weapons.${index}.quality`} render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between"><FormLabel>Qualidades</FormLabel><QualityInfoButton qualitiesString={field.value} tableId={tableId}/></div>
                                <FormControl><QualitySelector tableId={tableId} value={field.value} onChange={(val, desc) => { field.onChange(val); if(desc) setValue(`weapons.${index}.quality_desc`, desc, {shouldDirty:true}); }} targetType="weapon" /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name={`weapons.${index}.quality_desc`} render={({ field }) => (<FormItem><FormLabel>Regras</FormLabel><FormControl><Textarea {...field} className="min-h-[60px] text-sm bg-muted/30" /></FormControl></FormItem>)}/>
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* ARMADURAS */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Shield /> Armaduras</CardTitle>
            <ItemSelectorDialog tableId={tableId} categories={['armor']} onSelect={(template) => {
                if(template) appendArmor({ ...getDefaultArmor(), name: template.name, protection: template.data.protection, obstructive: template.data.obstructive, quality: template.data.quality, quality_desc: template.description, weight: template.weight });
                else appendArmor(getDefaultArmor());
            }}>
                <Button type="button" size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Armadura</Button>
            </ItemSelectorDialog>
          </div>
          <div className="pt-4 space-y-2">
            <span className="text-3xl font-bold">Defesa Total: {totalDefense}</span>
            <p className="text-xs text-muted-foreground">(Rápido {quick} - Carga/Armadura {activeBerserk ? "- Amoque" : ""})</p>
            <Button type="button" variant="outline" className="w-full" onClick={() => combatLogic.setIsDefenseRollOpen(true)}><Dices className="w-4 h-4" /> Rolar Defesa (vs {totalDefense})</Button>
          </div>
        </CardHeader>
        <CardContent>
           <Accordion type="multiple" className="space-y-4" value={openArmors} onValueChange={setOpenArmors}>
              {armorFields.map((field, index) => (
                 <AccordionItem key={field.id} value={field.id} className="p-3 rounded-md border bg-muted/20">
                    <div className="flex justify-between items-center w-full gap-2 p-0">
                       <AccordionTrigger className="p-0 hover:no-underline flex-1">
                           <div className="flex-1 flex items-center gap-2 text-left">
                               <h4 className="font-semibold text-base text-primary-foreground truncate">{form.watch(`armors.${index}.name`)}</h4>
                               <div className="flex gap-1.5"><Badge variant="secondary">Prot: {form.watch(`armors.${index}.protection`)}</Badge></div>
                           </div>
                       </AccordionTrigger>
                       <div className="flex items-center gap-1 pl-2" onClick={e => e.stopPropagation()}>
                           <Button type="button" size="icon" variant="ghost" onClick={() => unequipItem(index, 'armor')}><ArrowDownToLine className="w-4 h-4"/></Button>
                           <Button type="button" size="sm" variant="outline" onClick={() => handleProtectionRoll(index)}><Dices className="w-4 h-4"/><span className="hidden sm:inline ml-2">Rolar</span></Button>
                           <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeArmor(index)}><Trash2 className="w-4 h-4"/></Button>
                       </div>
                    </div>
                    <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                       <div className="space-y-4">
                          <div className="flex gap-4"><FormField control={form.control} name={`armors.${index}.name`} render={({field}) => <FormItem className="flex-1"><FormLabel>Nome</FormLabel><Input {...field}/></FormItem>} /><FormField control={form.control} name={`armors.${index}.weight`} render={({field}) => <FormItem className="w-24"><FormLabel>Peso</FormLabel><Input type="number" {...field}/></FormItem>} /></div>
                          <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name={`armors.${index}.protection`} render={({field}) => <FormItem><FormLabel>Proteção</FormLabel><Input {...field}/></FormItem>} /><FormField control={form.control} name={`armors.${index}.obstructive`} render={({field}) => <FormItem><FormLabel>Obstrutiva</FormLabel><Input type="number" {...field} onChange={e => field.onChange(e.target.value)}/></FormItem>} /></div>
                          <FormField control={form.control} name={`armors.${index}.quality`} render={({field}) => <FormItem><div className="flex justify-between"><FormLabel>Qualidades</FormLabel><QualityInfoButton qualitiesString={field.value} tableId={tableId}/></div><FormControl><QualitySelector tableId={tableId} value={field.value} onChange={(val, desc) => { field.onChange(val); if(desc) setValue(`armors.${index}.quality_desc`, desc, {shouldDirty:true}); }} targetType="armor"/></FormControl></FormItem>} />
                          <FormField control={form.control} name={`armors.${index}.equipped`} render={({field}) => <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="m-0">Equipada</FormLabel></FormItem>} />
                       </div>
                    </AccordionContent>
                 </AccordionItem>
              ))}
           </Accordion>
        </CardContent>
      </Card>

      {/* MODAIS */}
      {combatLogic.attackRollData && (
        <WeaponAttackDialog 
            open={!!combatLogic.attackRollData} 
            onOpenChange={(open) => !open && combatLogic.setAttackRollData(null)} 
            characterName={character.name} 
            tableId={character.table_id} 
            weaponName={combatLogic.attackRollData.weaponName} 
            attributeName={combatLogic.attackRollData.attributeName} 
            attributeValue={combatLogic.attackRollData.attributeValue} 
            projectileId={combatLogic.attackRollData.projectileId}
            onConfirm={() => combatLogic.consumeProjectile(combatLogic.attackRollData?.projectileId)}
        />
      )}
      
      {combatLogic.damageRollData && (
        <WeaponDamageDialog 
            open={!!combatLogic.damageRollData} 
            onOpenChange={(open) => !open && combatLogic.setDamageRollData(null)} 
            characterName={character.name} 
            tableId={character.table_id} 
            weaponName={combatLogic.damageRollData.weaponName} 
            damageString={combatLogic.damageRollData.damageString} 
        />
      )}
      <DefenseRollDialog open={combatLogic.isDefenseRollOpen} onOpenChange={combatLogic.setIsDefenseRollOpen} defenseValue={totalDefense} characterName={character.name} tableId={character.table_id} />
    </div>
  );
};