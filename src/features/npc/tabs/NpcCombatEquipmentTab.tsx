// src/features/npc/tabs/NpcCombatEquipmentTab.tsx

import { useState, useEffect } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Plus, Shield, Sword, Trash2, Box, Shirt, 
    Settings2, Droplets, Database as DbIcon, 
    Crosshair, Dices 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField, FormLabel, FormControl, FormItem } from "@/components/ui/form";

// --- IMPORTAÇÕES CORRIGIDAS E COMPLETAS ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
// ------------------------------------------

// --- Componentes Compartilhados ---
import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";
import { QualityInfoButton } from "@/components/QualityInfoButton";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { DefenseRollDialog } from "@/components/DefenseRollDialog";
import { QualitySelector } from "@/components/QualitySelector";

import { useToast } from "@/hooks/use-toast";
import { getDefaultNpcWeapon, getDefaultNpcArmor, NpcWeapon } from "../npc.schema";
import { getDefaultProjectile } from "@/features/character/character.schema";
import { attributesList } from "@/features/character/character.constants";
import { useNpcCalculations } from "../hooks/useNpcCalculations";
import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";

export const NpcCombatEquipmentTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet();
  const { setValue } = useFormContext();
  const { toast } = useToast();
  
  const tableId = npc?.table_id; 

  const { toughnessMax, painThreshold, corruptionThreshold } = useNpcCalculations(form);

  // Hook de lógica de combate
  const combatLogic = useCombatLogic({ 
      form, 
      fields: { currentToughness: "combat.toughness_current", maxToughness: "combat.toughness_max", tempToughness: "combat.temporary" }
  });

  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openArmors, setOpenArmors] = useState<string[]>([]);
  
  // Estados para Diálogos
  const [attackWeapon, setAttackWeapon] = useState<NpcWeapon | null>(null);
  const [damageWeapon, setDamageWeapon] = useState<NpcWeapon | null>(null);
  const [dbCategory, setDbCategory] = useState<'weapon' | 'armor' | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: 'weapon' | 'armor', index: number } | null>(null);
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });
  const { fields: projectileFields, append: appendProjectile, remove: removeProjectile } = useFieldArray({ control: form.control, name: "projectiles" });
  
  const projectiles = form.watch("projectiles") || [];

  // --- Sincronia de Limiar ---
  useEffect(() => {
     const currentFormVal = Number(form.getValues("combat.pain_threshold"));
     if (currentFormVal !== painThreshold) {
        form.setValue("combat.pain_threshold", painThreshold);
     }
  }, [painThreshold, form]);

  // --- LÓGICA DE DANO AUTOMÁTICA ---
  const handleDamage = (val: number) => {
      const armor = Number(form.getValues("combat.armor_rd")) || 0;
      const current = Number(form.getValues("combat.toughness_current")) || 0;
      const temporary = Number(form.getValues("combat.temporary")) || 0;

      // Aplica redução da armadura manual
      const damageToTake = Math.max(0, val - armor);
      
      let remainingDamage = damageToTake;
      let newTemporary = temporary;

      if (newTemporary > 0) {
          if (newTemporary >= remainingDamage) {
              newTemporary -= remainingDamage;
              remainingDamage = 0;
          } else {
              remainingDamage -= newTemporary;
              newTemporary = 0;
          }
      }

      const newCurrent = Math.max(0, current - remainingDamage);

      form.setValue("combat.temporary", newTemporary, { shouldDirty: true });
      form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true });

      toast({ 
          title: "Dano Aplicado", 
          description: `Recebeu ${val}. Absorvido ${armor}. Dano Real: ${damageToTake}.` 
      });
  };

  const handleHeal = (val: number) => {
      const current = Number(form.getValues("combat.toughness_current")) || 0;
      const max = Number(form.getValues("combat.toughness_max")) || 10;
      const newCurrent = Math.min(max, current + val);
      
      form.setValue("combat.toughness_current", newCurrent, { shouldDirty: true });
      toast({ title: "Cura Aplicada", description: `+${val} Vida.` });
  };

  const handleAddFromDb = (item: any) => {
    if (dbCategory === 'weapon') {
        const newWeapon = getDefaultNpcWeapon();
        newWeapon.name = item.name;
        newWeapon.damage = item.data?.damage || "1d8";
        newWeapon.quality = item.data?.quality || "";
        newWeapon.quality_desc = item.description || "";
        newWeapon.attackAttribute = item.data?.attackAttribute || "vigorous";
        appendWeapon(newWeapon);
        toast({ title: "Arma Adicionada", description: item.name });
    } else if (dbCategory === 'armor') {
        const newArmor = getDefaultNpcArmor();
        newArmor.name = item.name;
        newArmor.protection = item.data?.protection || "1d4";
        newArmor.quality = item.data?.quality || "";
        newArmor.quality_desc = item.description || "";
        appendArmor(newArmor);
        toast({ title: "Armadura Adicionada", description: item.name });
    }
    setDbCategory(null);
  };

  return (
    <div className="space-y-4 h-full flex flex-col p-1">
      {/* --- STATUS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* 1. DEFESA E ARMADURA (Manual) */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm bg-muted/10">
             <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> Defesa & Proteção</CardTitle>
             </CardHeader>
             <CardContent className="p-4 pt-2 flex flex-col gap-3">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-2 bg-background rounded-lg border shadow-sm">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Defesa</span>
                        <FormField control={form.control} name="combat.defense" render={({ field }) => (
                            <Input 
                                className="text-3xl font-black h-12 w-full text-center border-none bg-transparent focus-visible:ring-0 p-0" 
                                value={field.value} 
                                readOnly={isReadOnly}
                                onChange={e => field.onChange(e.target.value)} 
                            />
                        )} />
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-background rounded-lg border shadow-sm">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Armadura</span>
                        <FormField control={form.control} name="combat.armor_rd" render={({ field }) => (
                            <Input 
                                className="text-3xl font-black h-12 w-full text-center border-none bg-transparent focus-visible:ring-0 p-0" 
                                {...field} 
                                readOnly={isReadOnly}
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        )} />
                    </div>
                 </div>
                 
                 {/* Botão de Rolar Defesa Manual */}
                 <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => setIsDefenseRollOpen(true)}>
                    <Dices className="w-4 h-4" /> Rolar Defesa
                 </Button>
             </CardContent>
          </Card>

          {/* 2. VITALIDADE */}
          <VitalityCard 
            form={form}
            max={toughnessMax}
            painThreshold={painThreshold}
            currentField="combat.toughness_current"
            tempField="combat.temporary"
            maxBonusField="combat.toughness_max" 
            onDamage={handleDamage}
            onHeal={handleHeal}
            isReadOnly={isReadOnly}
          />

          {/* 3. CORRUPÇÃO */}
          <CorruptionCard 
            form={form} 
            threshold={corruptionThreshold}
            isReadOnly={isReadOnly}
          />
      </div>

      {/* --- ÁREA DE EQUIPAMENTO --- */}
      <Card className="flex-1 flex flex-col border-t-4 border-t-red-700 shadow-sm min-h-[400px]">
            <Tabs defaultValue="weapons" className="flex-1 flex flex-col">
                <CardHeader className="py-2 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="weapons" className="flex gap-2 text-xs"><Sword className="w-3.5 h-3.5"/> Armas</TabsTrigger>
                        <TabsTrigger value="armors" className="flex gap-2 text-xs"><Shirt className="w-3.5 h-3.5"/> Armaduras</TabsTrigger>
                        <TabsTrigger value="resources" className="flex gap-2 text-xs"><Box className="w-3.5 h-3.5"/> Recursos</TabsTrigger>
                    </TabsList>
                </CardHeader>
                
                <CardContent className="p-0 overflow-hidden flex-1 bg-muted/5">
                    
                    {/* --- ABA DE ARMAS --- */}
                    <TabsContent value="weapons" className="h-full m-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-3">
                                {!isReadOnly && (
                                    <div className="flex gap-2 mb-4">
                                        <Button type="button" size="sm" variant="outline" className="flex-1 border-dashed h-9" onClick={() => setDbCategory('weapon')}>
                                            <DbIcon className="w-4 h-4 mr-2 text-primary"/> Importar do Database
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" className="h-9 px-3" onClick={() => appendWeapon(getDefaultNpcWeapon())}>
                                            <Plus className="w-4 h-4"/> Criar Manual
                                        </Button>
                                    </div>
                                )}

                                <Accordion type="multiple" className="space-y-2" value={openWeapons} onValueChange={setOpenWeapons}>
                                    {weaponFields.map((field, index) => {
                                        const weapon = form.watch(`weapons.${index}`);
                                        return (
                                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                                            <div className="flex items-center justify-between py-2">
                                                <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                                    <div className="flex flex-col items-start text-left gap-1">
                                                        <span className="font-semibold text-sm">{weapon.name}</span>
                                                        <div className="flex gap-1">
                                                            <Badge variant="destructive" className="text-[10px] h-4 px-1">{weapon.damage}</Badge>
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{attributesList.find(a => a.key === weapon.attackAttribute)?.label || "ATR"}</Badge>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <div className="flex items-center gap-1">
                                                    <Button type="button" size="sm" variant="ghost" className="h-8 w-8" onClick={() => setAttackWeapon(weapon)} title="Ataque"><Dices className="w-4 h-4 text-primary" /></Button>
                                                    <Button type="button" size="sm" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setDamageWeapon(weapon)} title="Dano"><Droplets className="w-4 h-4" /></Button>
                                                    {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => removeWeapon(index)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                                </div>
                                            </div>
                                            <AccordionContent className="border-t pt-2 space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <FormField control={form.control} name={`weapons.${index}.name`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>)} />
                                                    <FormField control={form.control} name={`weapons.${index}.damage`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>)} />
                                                </div>
                                                <FormField control={form.control} name={`weapons.${index}.quality`} render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between"><FormLabel className="text-[10px]">Qualidades</FormLabel><QualityInfoButton qualitiesString={field.value} tableId={tableId}/></div>
                                                        {!isReadOnly ? <QualitySelector tableId={tableId} value={field.value} onChange={(val, desc) => { field.onChange(val); if(desc) setValue(`weapons.${index}.quality_desc`, desc, {shouldDirty:true}); }} targetType="weapon" /> : <Input {...field} className="h-7 text-xs" readOnly />}
                                                    </div>
                                                )}/>
                                                <FormField control={form.control} name={`weapons.${index}.quality_desc`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Regras</FormLabel><FormControl><Textarea {...field} className="min-h-[40px] text-xs bg-muted/20" readOnly={isReadOnly}/></FormControl></FormItem>)}/>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )})}
                                </Accordion>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* --- ABA DE ARMADURAS --- */}
                    <TabsContent value="armors" className="h-full m-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-3">
                                {!isReadOnly && (
                                    <div className="flex gap-2 mb-4">
                                        <Button type="button" size="sm" variant="outline" className="flex-1 border-dashed h-9" onClick={() => setDbCategory('armor')}>
                                            <DbIcon className="w-4 h-4 mr-2"/> Importar Armadura
                                        </Button>
                                        <Button type="button" size="sm" variant="secondary" className="h-9 px-3" onClick={() => appendArmor(getDefaultNpcArmor())}>
                                            <Plus className="w-4 h-4"/> Criar Manual
                                        </Button>
                                    </div>
                                )}

                                <Accordion type="multiple" className="space-y-2" value={openArmors} onValueChange={setOpenArmors}>
                                    {armorFields.map((field, index) => {
                                        const armor = form.watch(`armors.${index}`);
                                        return (
                                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                                            <div className="flex items-center justify-between py-2">
                                                <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                                    <div className="flex items-center gap-2">
                                                        <Switch checked={armor.equipped} onCheckedChange={(c) => setValue(`armors.${index}.equipped`, c, {shouldDirty: true})} disabled={isReadOnly} />
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="font-semibold text-sm">{armor.name}</span>
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">Prot: {armor.protection}</Badge>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => removeArmor(index)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                            </div>
                                            <AccordionContent className="border-t pt-2 space-y-2">
                                                <div className="flex gap-2">
                                                    <FormField control={form.control} name={`armors.${index}.name`} render={({ field }) => (<FormItem className="flex-[2]"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>)} />
                                                    <FormField control={form.control} name={`armors.${index}.protection`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-[10px]">Proteção</FormLabel><Input {...field} className="h-7 text-xs" readOnly={isReadOnly}/></FormItem>)} />
                                                </div>
                                                <FormField control={form.control} name={`armors.${index}.quality`} render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between"><FormLabel className="text-[10px]">Qualidades</FormLabel><QualityInfoButton qualitiesString={field.value} tableId={tableId}/></div>
                                                        {!isReadOnly ? <QualitySelector tableId={tableId} value={field.value} onChange={(val, desc) => { field.onChange(val); if(desc) setValue(`armors.${index}.quality_desc`, desc, {shouldDirty:true}); }} targetType="armor" /> : <Input {...field} className="h-7 text-xs" readOnly />}
                                                    </div>
                                                )}/>
                                                <FormField control={form.control} name={`armors.${index}.quality_desc`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Regras</FormLabel><FormControl><Textarea {...field} className="min-h-[40px] text-xs bg-muted/20" readOnly={isReadOnly}/></FormControl></FormItem>)}/>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )})}
                                </Accordion>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* RECURSOS */}
                    <TabsContent value="resources" className="h-full m-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-3">
                                {!isReadOnly && <Button type="button" size="sm" variant="dashed" className="w-full mb-2" onClick={() => appendProjectile(getDefaultProjectile())}><Plus className="w-4 h-4 mr-2"/> Adicionar Recurso</Button>}
                                {projectileFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <FormField control={form.control} name={`projectiles.${index}.name`} render={({field}) => (
                                            <Input {...field} className="h-8 text-sm flex-1 font-medium border-transparent hover:border-input" placeholder="Nome (Ex: Flechas)" readOnly={isReadOnly} />
                                        )}/>
                                        <FormField control={form.control} name={`projectiles.${index}.quantity`} render={({field}) => (
                                            <div className="flex items-center gap-1 bg-muted rounded px-2 border">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Qtd</span>
                                                <Input {...field} type="number" className="h-8 w-14 text-center border-none bg-transparent focus-visible:ring-0 p-0" readOnly={isReadOnly} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                            </div>
                                        )}/>
                                        {!isReadOnly && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeProjectile(index)}><Trash2 className="w-4 h-4"/></Button>}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </CardContent>
            </Tabs>
      </Card>

      {/* DIÁLOGOS DE ROLAGEM */}
      <ItemSelectorDialog 
            open={!!dbCategory} 
            onOpenChange={(o) => !o && setDbCategory(null)}
            onSelect={handleAddFromDb}
            categoryFilter={dbCategory || undefined}
            tableId={tableId}
      />

      {attackWeapon && (
            <WeaponAttackDialog 
                open={!!attackWeapon} 
                onOpenChange={o => !o && setAttackWeapon(null)} 
                weapon={attackWeapon}
                attributes={form.getValues("attributes")}
                characterName={npc?.name}
                tableId={tableId}
            />
      )}

      {damageWeapon && (
            <WeaponDamageDialog 
                open={!!damageWeapon}
                onOpenChange={o => !o && setDamageWeapon(null)}
                weapon={damageWeapon}
                characterName={npc?.name}
                tableId={tableId}
            />
      )}

      <DefenseRollDialog 
            open={isDefenseRollOpen} 
            onOpenChange={setIsDefenseRollOpen} 
            defenseValue={Number(form.watch("combat.defense")) || 0}
            characterName={npc?.name} 
            tableId={tableId} 
      />
    </div>
  );
};