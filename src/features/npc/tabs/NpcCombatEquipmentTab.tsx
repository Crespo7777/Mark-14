import { useState, useEffect } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Sword, Dices, Shield, Heart } from "lucide-react";
import { getDefaultNpcWeapon, getDefaultNpcArmor } from "../npc.schema";
import { attributesList } from "@/features/character/character.constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { roundUpDiv } from "@/features/character/character.schema";
import { Separator } from "@/components/ui/separator";
import { QualityInfoButton } from "@/components/QualityInfoButton";
import { QualitySelector } from "@/components/QualitySelector"; // <-- IMPORTADO

type AttackRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
};

const DamageHealControl = ({
  label,
  onApply,
}: {
  label: string;
  onApply: (amount: number) => void;
}) => {
  const [amount, setAmount] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-16 h-9 text-center"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onApply(parseInt(amount) || 0);
          setAmount("");
        }}
      >
        {label}
      </Button>
    </div>
  );
};

export const NpcCombatEquipmentTab = () => {
  const { form, isReadOnly, npc } = useNpcSheet();
  const { toast } = useToast();
  const { getValues, setValue } = useFormContext();
  const tableId = npc.table_id;

  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openArmors, setOpenArmors] = useState<string[]>([]);
  const [displayDefense, setDisplayDefense] = useState<string>(() => {
    const val = form.getValues("combat.defense");
    return val === 0 || isNaN(val) ? "" : String(val);
  });

  const currentToughness = Number(form.watch("combat.toughness_current")) || 0;
  const maxToughness = Number(form.watch("combat.toughness_max")) || 10;
  const watchedDefense = form.watch("combat.defense");
  const vigorous = Number(form.watch("attributes.vigorous.value")) || 0;
  const painThresholdBonus = Number(form.watch("combat.pain_threshold_bonus")) || 0;

  useEffect(() => {
    if (!isReadOnly) {
      const newMaxToughness = Math.max(10, vigorous);
      form.setValue("combat.toughness_max", newMaxToughness);

      const basePainThreshold = roundUpDiv(vigorous, 2);
      const bonus = painThresholdBonus;
      form.setValue("combat.pain_threshold", basePainThreshold + bonus);
    }
  }, [vigorous, painThresholdBonus, form, isReadOnly]);

  useEffect(() => {
    const numVal = isNaN(Number(watchedDefense)) ? 0 : Number(watchedDefense);
    const displayNum = parseInt(displayDefense, 10) || 0;
    if (numVal !== displayNum) {
      setDisplayDefense(numVal === 0 ? "" : String(numVal));
    }
  }, [watchedDefense]);

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({
    control: form.control,
    name: "weapons",
  });

  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({
    control: form.control,
    name: "armors",
  });

  const handleDamage = (rawDamage: number) => {
    const armorRD = Number(form.getValues("combat.armor_rd")) || 0;
    const painThreshold = Number(form.getValues("combat.pain_threshold")) || 0;
    const current = Number(form.getValues("combat.toughness_current")) || 0;
    const actualDamage = Math.max(0, rawDamage - armorRD);
    const newToughness = Math.max(0, current - actualDamage);
    form.setValue("combat.toughness_current", newToughness, { shouldDirty: true });
    toast({ title: "Dano Aplicado!", description: `${rawDamage} (Dano) - ${armorRD} (Armadura) = ${actualDamage} (Dano Real)` });
    if (actualDamage > painThreshold && painThreshold > 0) {
      toast({ title: "Limiar de Dor Excedido!", description: "O dano superou o Limiar de Dor. O NPC pode estar atordoado.", variant: "destructive" });
    }
  };

  const handleHeal = (healAmount: number) => {
    const current = Number(form.getValues("combat.toughness_current")) || 0;
    const max = Number(form.getValues("combat.toughness_max")) || 10;
    const newToughness = Math.min(max, current + healAmount);
    form.setValue("combat.toughness_current", newToughness, { shouldDirty: true });
    toast({ title: "Cura Aplicada!", description: `+${healAmount} Vitalidade.` });
  };

  const handleAttackClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === weapon.attackAttribute);
    const attributeValue = selectedAttr ? Number(allAttributes[selectedAttr.key as keyof typeof allAttributes].value) || 0 : 0;
    if (attributeValue === 0 || !selectedAttr) { toast({ title: "Atributo inválido", description: "Defina o atributo de ataque.", variant: "destructive" }); return; }
    setAttackRollData({ abilityName: weapon.name || "Ataque NPC", attributeName: selectedAttr.label, attributeValue: attributeValue });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="text-red-500" /> Vitalidade & Resistência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="combat.toughness_current" render={({ field }) => (<FormItem><FormLabel>Atual</FormLabel><FormControl><Input type="number" className="text-2xl font-bold h-12" {...field} onChange={(e) => field.onChange(e.target.value)} readOnly={isReadOnly} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="combat.toughness_max" render={({ field }) => (<FormItem><FormLabel>Máxima</FormLabel><FormControl><Input type="number" className="text-2xl font-bold h-12 bg-muted/50" {...field} readOnly /></FormControl></FormItem>)}/>
            </div>
            <Progress value={(currentToughness / (maxToughness || 10)) * 100} className="h-2" />
            <div className="flex gap-2 pt-2"><DamageHealControl label="Dano" onApply={handleDamage} /><DamageHealControl label="Cura" onApply={handleHeal} /></div>
            <div className="grid grid-cols-3 gap-4 pt-2">
                 <FormField control={form.control} name="combat.armor_rd" render={({ field }) => (<FormItem><FormLabel className="text-xs">Armadura (RD)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly}/></FormControl></FormItem>)}/>
                 <FormField control={form.control} name="combat.pain_threshold_bonus" render={({ field }) => (<FormItem><FormLabel className="text-xs">Bônus Dor</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly}/></FormControl></FormItem>)}/>
                 <FormField control={form.control} name="combat.pain_threshold" render={({ field }) => (<FormItem><FormLabel className="text-xs">Limiar Total</FormLabel><FormControl><Input type="number" className="bg-muted/50" {...field} readOnly/></FormControl></FormItem>)}/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="text-blue-500" /> Defesa & Corrupção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="combat.defense" render={({ field }) => (
                <FormItem>
                  <FormLabel>Defesa (Modificador)</FormLabel>
                  <FormControl>
                    <Input type="text" className="text-3xl font-bold h-16 text-center" placeholder="0" value={field.value === undefined || isNaN(Number(field.value)) ? "" : field.value} onChange={(e) => { const val = e.target.value; if (val === "" || val === "-") { setDisplayDefense(val); field.onChange(0); } else if (/^-?\d*$/.test(val)) { setDisplayDefense(val); field.onChange(parseInt(val, 10)); } }} readOnly={isReadOnly} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="corruption.temporary" render={({ field }) => (<FormItem><FormLabel>Corr. Temp</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="corruption.permanent" render={({ field }) => (<FormItem><FormLabel>Corr. Perm</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} readOnly={isReadOnly} /></FormControl></FormItem>)}/>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="flex items-center gap-2 text-lg"><Sword /> Armas</CardTitle>
           <Button size="sm" onClick={() => appendWeapon(getDefaultNpcWeapon())} disabled={isReadOnly}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
        </CardHeader>
        <CardContent>
           {weaponFields.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma arma.</p>}
           <Accordion type="multiple" className="space-y-4" value={openWeapons} onValueChange={setOpenWeapons}>
              {weaponFields.map((field, index) => {
                 const stableId = getValues(`weapons.${index}.id`) || field.id;
                 return (
                 <AccordionItem key={stableId} value={stableId} className="p-3 rounded-md border bg-muted/20">
                    <div className="flex justify-between items-center w-full gap-2 p-0">
                       <AccordionTrigger className="p-0 hover:no-underline flex-1">
                          <div className="flex-1 flex items-center gap-2 sm:gap-4 text-left">
                             <h4 className="font-semibold text-base text-primary-foreground truncate">{form.watch(`weapons.${index}.name`) || "Nova Arma"}</h4>
                             <Badge variant="secondary" className="px-1.5 py-0.5">Dano: {form.watch(`weapons.${index}.damage`) || "N/A"}</Badge>
                          </div>
                       </AccordionTrigger>
                       <div className="flex items-center gap-1 pl-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => handleAttackClick(index)}><Dices className="w-4 h-4" /><span className="hidden sm:inline ml-2">Atacar</span></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeWeapon(index)} disabled={isReadOnly}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                    </div>
                    <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                       <div className="space-y-4">
                          <FormField control={form.control} name={`weapons.${index}.name`} render={({field}) => (
                             <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Garras" {...field} readOnly={isReadOnly}/></FormControl></FormItem>
                          )}/>
                          <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name={`weapons.${index}.attackAttribute`} render={({field}) => (
                                 <FormItem>
                                    <FormLabel>Atributo Atq</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{attributesList.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent></Select>
                                 </FormItem>
                              )}/>
                              <FormField control={form.control} name={`weapons.${index}.damage`} render={({field}) => (
                                 <FormItem><FormLabel>Dano (Fixo/Dado)</FormLabel><FormControl><Input placeholder="4" {...field} readOnly={isReadOnly}/></FormControl></FormItem>
                              )}/>
                          </div>

                          <FormField control={form.control} name={`weapons.${index}.quality`} render={({field}) => (
                             <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Qualidades</FormLabel>
                                    <QualityInfoButton qualitiesString={field.value} tableId={tableId} />
                                </div>
                                <FormControl>
                                    {isReadOnly ? (
                                        <Input value={field.value} readOnly />
                                    ) : (
                                        <QualitySelector 
                                            tableId={tableId} 
                                            value={field.value} 
                                            onChange={(val) => field.onChange(val)} 
                                            targetType="weapon" 
                                        />
                                    )}
                                </FormControl>
                             </FormItem>
                          )}/>
                       </div>
                    </AccordionContent>
                 </AccordionItem>
                 );
              })}
           </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="flex items-center gap-2 text-lg"><Shield /> Armaduras</CardTitle>
           <Button size="sm" onClick={() => appendArmor(getDefaultNpcArmor())} disabled={isReadOnly}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
        </CardHeader>
        <CardContent>
           {armorFields.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma armadura.</p>}
           <Accordion type="multiple" className="space-y-4" value={openArmors} onValueChange={setOpenArmors}>
              {armorFields.map((field, index) => {
                 const stableId = getValues(`armors.${index}.id`) || field.id;
                 return (
                 <AccordionItem key={stableId} value={stableId} className="p-3 rounded-md border bg-muted/20">
                    <div className="flex justify-between items-center w-full gap-2 p-0">
                       <AccordionTrigger className="p-0 hover:no-underline flex-1">
                          <div className="flex-1 flex items-center gap-2 sm:gap-4 text-left">
                             <h4 className="font-semibold text-base text-primary-foreground truncate">{form.watch(`armors.${index}.name`) || "Nova Armadura"}</h4>
                             <Badge variant="outline" className="px-1.5 py-0.5">Prot: {form.watch(`armors.${index}.protection`) || "0"}</Badge>
                          </div>
                       </AccordionTrigger>
                       <div className="flex items-center gap-1 pl-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeArmor(index)} disabled={isReadOnly}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                    </div>
                    <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                       <div className="space-y-4">
                          <FormField control={form.control} name={`armors.${index}.name`} render={({field}) => (
                             <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Pele Grossa" {...field} readOnly={isReadOnly}/></FormControl></FormItem>
                          )}/>
                          <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name={`armors.${index}.protection`} render={({field}) => (
                                 <FormItem><FormLabel>Proteção</FormLabel><FormControl><Input placeholder="2" {...field} readOnly={isReadOnly}/></FormControl></FormItem>
                              )}/>
                              
                              <FormField control={form.control} name={`armors.${index}.quality`} render={({field}) => (
                                 <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Qualidades</FormLabel>
                                        <QualityInfoButton qualitiesString={field.value} tableId={tableId} />
                                    </div>
                                    <FormControl>
                                        {isReadOnly ? (
                                            <Input value={field.value} readOnly />
                                        ) : (
                                            <QualitySelector 
                                                tableId={tableId} 
                                                value={field.value} 
                                                onChange={(val) => field.onChange(val)}
                                                targetType="armor" 
                                            />
                                        )}
                                    </FormControl>
                                 </FormItem>
                              )}/>
                          </div>
                       </div>
                    </AccordionContent>
                 </AccordionItem>
                 );
              })}
           </Accordion>
        </CardContent>
      </Card>

      {attackRollData && (
        <NpcAbilityRollDialog
          open={!!attackRollData}
          onOpenChange={(open) => !open && setAttackRollData(null)}
          {...attackRollData}
          buttonText="Rolar Ataque"
        />
      )}
    </div>
  );
};