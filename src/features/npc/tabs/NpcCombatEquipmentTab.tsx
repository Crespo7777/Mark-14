import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sword, Dices, Trash2, Plus, Anchor } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel, FormControl, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // Importante para o feedback visual

import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";

import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";
import { useNpcCalculations } from "../hooks/useNpcCalculations";

export const NpcCombatEquipmentTab = () => {
  const { form, npc } = useNpcSheet();
  const calculations = useNpcCalculations();
  const { toast } = useToast(); // Hook de notificações
  
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });

  const combatLogic = useCombatLogic({
      form,
      fields: { currentToughness: "toughness.current", maxToughness: "toughness.max" }
  });

  // --- NOVA LÓGICA DE DANO AUTOMÁTICO ---
  const handleSmartDamage = (incomingDamage: number) => {
      const dr = calculations.damageReduction;
      
      // Se tiver redução de dano, subtrai
      if (dr > 0) {
          const finalDamage = Math.max(0, incomingDamage - dr);
          
          // Aplica o dano reduzido
          combatLogic.handleDamage(finalDamage);
          
          // Avisa o mestre visualmente
          toast({
              title: "Dano Reduzido pela Armadura",
              description: `Recebido: ${incomingDamage} | Redução: ${dr} | Dano Real: ${finalDamage}`,
              variant: "default", // Ou "info" se tiver configurado
          });
      } else {
          // Se não tiver armadura, aplica direto
          combatLogic.handleDamage(incomingDamage);
      }
  };

  const onHeal = (val: number) => combatLogic.handleHeal(val, calculations.toughnessMax);

  const addBasicAttack = () => {
      appendWeapon({ name: "Novo Ataque", damage: "1d6", attackAttribute: "vigorous", quality: "" });
  };

  const addBasicArmor = () => {
      appendArmor({ name: "Armadura Natural", protection: "2", obstructive: 0, equipped: true });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* --- STATUS VITAIS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* 1. Defesa Manual */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
             <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> Defesa</CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                 {/* Input Manual para Defesa */}
                 <FormField
                    control={form.control}
                    name="stats.defense"
                    render={({ field }) => (
                        <div className="relative w-24">
                            <Input 
                                {...field} 
                                type="number" 
                                className="text-4xl font-extrabold text-center h-16 tracking-tighter bg-transparent border-2 border-muted focus:border-primary"
                                placeholder="0"
                            />
                        </div>
                    )}
                 />
                 <div className="text-xs text-muted-foreground text-center px-2">
                    Modificador de Defesa<br/>(Ex: -5 ou +3)
                 </div>
             </CardContent>
          </Card>

          {/* 2. Vitalidade (Com Redução de Dano Automática) */}
          <VitalityCard 
            form={form}
            max={calculations.toughnessMax}
            painThreshold={calculations.painThreshold}
            onDamage={handleSmartDamage} // <--- Aqui está a mágica
            onHeal={onHeal}
          />

          {/* 3. Corrupção */}
          <CorruptionCard 
            form={form} 
            threshold={calculations.corruptionThreshold} 
          />
      </div>

      {/* --- LISTAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          
          {/* ATAQUES */}
          <Card className="flex flex-col border-t-4 border-t-orange-500 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Sword className="w-4 h-4 text-orange-500" /> Ataques</CardTitle>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={addBasicAttack}><Plus className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                {/* ... (Conteúdo da lista de armas igual ao anterior) ... */}
                <Accordion type="multiple" className="space-y-2" value={openWeapons} onValueChange={setOpenWeapons}>
                    {weaponFields.map((field, index) => (
                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                            <div className="flex items-center justify-between py-2">
                                <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                    <div className="flex flex-col items-start text-left gap-1">
                                        <span className="font-semibold text-sm">{form.watch(`weapons.${index}.name`)}</span>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-muted">{form.watch(`weapons.${index}.damage`)}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1">
                                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7" onClick={() => combatLogic.prepareNpcAttack(index)}><Dices className="w-4 h-4 text-primary" /></Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => combatLogic.prepareDamage(index)}><Sword className="w-4 h-4" /></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => removeWeapon(index)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                            <AccordionContent className="border-t pt-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`weapons.${index}.name`} render={({ field }) => (
                                        <div className="space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                    )} />
                                    <FormField control={form.control} name={`weapons.${index}.damage`} render={({ field }) => (
                                        <div className="space-y-1"><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                    )} />
                                </div>
                                <FormField control={form.control} name={`weapons.${index}.quality_desc`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px]">Efeitos</FormLabel><FormControl><Textarea {...field} className="min-h-[40px] text-xs bg-muted/20" /></FormControl></FormItem>
                                )}/>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
          </Card>

          {/* ARMADURA / PROTEÇÃO (Mostra Total Calculado) */}
          <Card className="flex flex-col border-t-4 border-t-slate-500 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" /> Proteção</CardTitle>
                    {calculations.damageReduction > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 hover:bg-slate-300">
                            DR: {calculations.damageReduction}
                        </Badge>
                    )}
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={addBasicArmor}><Plus className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                {/* ... (Lista de armaduras) ... */}
                <div className="space-y-2">
                    {armorFields.map((field, index) => (
                        <div key={field.id} className="border rounded bg-card p-2 space-y-2 relative group">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-muted-foreground">Item #{index + 1}</span>
                                <Button type="button" size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeArmor(index)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                            <div className="flex gap-2">
                                <FormField control={form.control} name={`armors.${index}.name`} render={({ field }) => (
                                    <div className="space-y-1 flex-[2]"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" placeholder="Ex: Casca Grossa" /></div>
                                )} />
                                <FormField control={form.control} name={`armors.${index}.protection`} render={({ field }) => (
                                    <div className="space-y-1 flex-1"><FormLabel className="text-[10px]">Valor (Fixo)</FormLabel><Input {...field} className="h-7 text-xs" placeholder="2" type="number" /></div>
                                )} />
                            </div>
                             <div className="text-[10px] text-muted-foreground">
                                Use números fixos para redução automática (Ex: 2). Se usar dados (Ex: 1d4), a redução será 0.
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
      </div>

      {/* Diálogos de Combate */}
      {combatLogic.attackRollData && <WeaponAttackDialog open={!!combatLogic.attackRollData} onOpenChange={(o) => !o && combatLogic.setAttackRollData(null)} characterName={npc.name} tableId={npc.table_id} {...combatLogic.attackRollData} />}
      {combatLogic.damageRollData && <WeaponDamageDialog open={!!combatLogic.damageRollData} onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} characterName={npc.name} tableId={npc.table_id} {...combatLogic.damageRollData} />}
    </div>
  );
};