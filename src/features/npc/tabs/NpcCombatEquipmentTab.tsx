import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Shield, Sword, Dices, Trash2, Box } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componentes
import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog";
import { useToast } from "@/hooks/use-toast";

import { getDefaultNpcWeapon } from "../npc.schema";
import { getDefaultProjectile } from "@/features/character/character.schema";
import { attributesList } from "@/features/character/character.constants";

type AttackRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
};

export const NpcCombatEquipmentTab = () => {
  const { form, isReadOnly } = useNpcSheet();
  const { toast } = useToast();
  
  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  
  // --- OTIMIZAÇÃO DE PERFORMANCE ---
  // NÃO observar toughness_current aqui. Isso causa re-render da aba inteira a cada ponto de dano.
  // Observamos apenas o que afeta o layout estático ou máximos.
  const maxToughness = Number(form.watch("combat.toughness_max")) || 10;
  const painThreshold = Number(form.watch("combat.pain_threshold")) || 0;
  const resolute = Number(form.watch("attributes.resolute.value")) || 0;

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: projectileFields, append: appendProjectile, remove: removeProjectile } = useFieldArray({ control: form.control, name: "projectiles" });

  // Funções de Dano/Cura (Usando getValues para performance)
  const handleDamage = (val: number) => {
      // Ler valores apenas no momento da ação (sem re-render)
      const armor = Number(form.getValues("combat.armor_rd")) || 0;
      const current = Number(form.getValues("combat.toughness_current")) || 0;
      const temporary = Number(form.getValues("combat.temporary")) || 0;

      const damageToTake = Math.max(0, val - armor);
      let remainingDamage = damageToTake;
      let newTemporary = temporary;

      // 1. Absorver com Temp HP
      if (newTemporary > 0) {
          if (newTemporary >= remainingDamage) {
              newTemporary -= remainingDamage;
              remainingDamage = 0;
          } else {
              remainingDamage -= newTemporary;
              newTemporary = 0;
          }
      }

      // 2. Aplicar resto à Vida Real
      const newCurrent = Math.max(0, current - remainingDamage);

      // Salvar (Isso vai disparar atualização apenas no VitalityCard que observa o campo)
      form.setValue("combat.temporary", newTemporary, { shouldDirty: true });
      form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true });

      toast({ 
          title: "Dano no NPC", 
          description: `Total: ${val} (-${armor} Arm). (Temp: ${temporary}->${newTemporary}, Vida: ${current}->${newCurrent})` 
      });
  };

  const handleHeal = (val: number) => {
      const currentToughness = Number(form.getValues("combat.toughness_current")) || 0;
      const max = Number(form.getValues("combat.toughness_max")) || 10;
      
      const newCurrent = Math.min(max, currentToughness + val);
      form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true });
      toast({ title: `NPC Curado`, description: `+${val} Vitalidade` });
  };

  const handleAttackClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    const attrs = form.getValues("attributes");
    const attr = attributesList.find(a => a.key === weapon.attackAttribute);
    const val = attr ? Number(attrs[attr.key]?.value) : 0;
    
    setAttackRollData({
        abilityName: weapon.name,
        attributeName: attr?.label || "Atributo",
        attributeValue: val
    });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
        
        {/* --- DASHBOARD NPC (3 COLUNAS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* DEFESA NPC */}
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
                    <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500"/> Defesa & Armadura</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center">
                        <FormField control={form.control} name="combat.defense" render={({ field }) => (
                            <Input 
                                className="text-3xl font-extrabold h-12 w-20 text-center border-2 border-border/50" 
                                {...field} 
                                readOnly={isReadOnly}
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        )} />
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Defesa</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <FormField control={form.control} name="combat.armor_rd" render={({ field }) => (
                            <Input 
                                className="text-3xl font-extrabold h-12 w-20 text-center border-2 border-border/50" 
                                {...field} 
                                readOnly={isReadOnly}
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        )} />
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Red. Dano</span>
                    </div>
                </CardContent>
            </Card>

            {/* VITALIDADE NPC */}
            <VitalityCard 
                form={form}
                currentField="combat.toughness_current"
                tempField="combat.temporary"          
                maxBonusField="combat.toughness_max"  
                max={maxToughness}
                painThreshold={painThreshold}
                onDamage={handleDamage}
                onHeal={handleHeal}
                isReadOnly={isReadOnly}
            />

            {/* CORRUPÇÃO NPC */}
            <CorruptionCard 
                form={form}
                threshold={Math.ceil(resolute / 2)}
                isReadOnly={isReadOnly}
            />
        </div>

        {/* --- TABS: ARMAS e RECURSOS --- */}
        <Card className="flex-1 flex flex-col border-t-4 border-t-red-700 shadow-sm">
            <Tabs defaultValue="weapons" className="flex-1 flex flex-col">
                <CardHeader className="py-2 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="weapons" className="flex gap-2"><Sword className="w-4 h-4"/> Combate</TabsTrigger>
                        <TabsTrigger value="resources" className="flex gap-2"><Box className="w-4 h-4"/> Recursos & Munição</TabsTrigger>
                    </TabsList>
                </CardHeader>
                
                <CardContent className="p-2 overflow-y-auto flex-1">
                    
                    <TabsContent value="weapons" className="m-0 space-y-2">
                        {!isReadOnly && <Button size="sm" variant="ghost" className="w-full border border-dashed mb-2" onClick={() => appendWeapon(getDefaultNpcWeapon())}><Plus className="w-4 h-4 mr-2"/> Adicionar Ataque</Button>}
                        <Accordion type="multiple" className="space-y-2" value={openWeapons} onValueChange={setOpenWeapons}>
                            {weaponFields.map((field, index) => (
                                <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                                    <div className="flex items-center justify-between py-2">
                                        <AccordionTrigger className="p-0 hover:no-underline flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{form.watch(`weapons.${index}.name`)}</span>
                                                <Badge variant="secondary" className="text-[10px]">{form.watch(`weapons.${index}.damage`)}</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAttackClick(index)}><Dices className="w-3 h-3"/> Rolar</Button>
                                        {!isReadOnly && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeWeapon(index)}><Trash2 className="w-3 h-3"/></Button>}
                                    </div>
                                    <AccordionContent className="border-t pt-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField control={form.control} name={`weapons.${index}.name`} render={({field}) => <FormItem><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>} />
                                            <FormField control={form.control} name={`weapons.${index}.damage`} render={({field}) => <FormItem><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </TabsContent>

                    <TabsContent value="resources" className="m-0 space-y-2">
                        {!isReadOnly && <Button size="sm" variant="ghost" className="w-full border border-dashed mb-2" onClick={() => appendProjectile(getDefaultProjectile())}><Plus className="w-4 h-4 mr-2"/> Adicionar Recurso</Button>}
                        {projectileFields.map((field, index) => (
                            <div key={field.id} className="border rounded p-2 flex items-center gap-2 bg-card">
                                <FormField control={form.control} name={`projectiles.${index}.name`} render={({field}) => (
                                    <Input {...field} className="h-8 text-sm flex-1" placeholder="Nome (Ex: Flechas)" readOnly={isReadOnly} />
                                )}/>
                                <FormField control={form.control} name={`projectiles.${index}.quantity`} render={({field}) => (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Qtd:</span>
                                        <Input {...field} type="number" className="h-8 w-16 text-center" readOnly={isReadOnly} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                    </div>
                                )}/>
                                {!isReadOnly && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeProjectile(index)}><Trash2 className="w-4 h-4"/></Button>}
                            </div>
                        ))}
                    </TabsContent>

                </CardContent>
            </Tabs>
        </Card>

        {attackRollData && (
            <NpcAbilityRollDialog 
                open={!!attackRollData} 
                onOpenChange={o => !o && setAttackRollData(null)} 
                {...attackRollData} 
                buttonText="Rolar Ataque"
            />
        )}
    </div>
  );
};