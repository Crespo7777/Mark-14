import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sword, Dices, Trash2, Plus, Target, Database, PenTool, Minus, Crosshair } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel, FormControl, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; 
import { useToast } from "@/hooks/use-toast";

import { VitalityCard } from "@/features/combat/components/VitalityCard";
import { CorruptionCard } from "@/features/combat/components/CorruptionCard";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { QualityInfoButton } from "@/components/QualityInfoButton";
import { QualitySelector } from "@/components/QualitySelector";

import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";
import { useNpcCalculations } from "../hooks/useNpcCalculations";

export const NpcCombatEquipmentTab = () => {
  const { form, npc } = useNpcSheet();
  const calculations = useNpcCalculations();
  const { toast } = useToast();
  
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openProjectiles, setOpenProjectiles] = useState<string[]>([]); 
  
  const [isWeaponSelectorOpen, setIsWeaponSelectorOpen] = useState(false);
  const [isArmorSelectorOpen, setIsArmorSelectorOpen] = useState(false);
  const [isProjectileSelectorOpen, setIsProjectileSelectorOpen] = useState(false);

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });
  const { fields: projectileFields, append: appendProjectile, remove: removeProjectile } = useFieldArray({ control: form.control, name: "projectiles" });

  const combatLogic = useCombatLogic({
      form,
      fields: { currentToughness: "toughness.current", maxToughness: "toughness.max" }
  });

  // --- Funções Manuais (Fallback) ---
  const addManualWeapon = () => appendWeapon({ name: "Nova Arma", damage: "1d6", attackAttribute: "vigorous", quality_desc: "", is_natural: false });
  const addManualArmor = () => appendArmor({ name: "Nova Armadura", protection: "0", obstructive: 0, equipped: true, quality_desc: "" });
  
  // ATUALIZADO: Inicializa com attack_bonus
  const addManualProjectile = () => appendProjectile({ 
      id: crypto.randomUUID(), 
      name: "Nova Munição", 
      amount: 10, 
      damage_bonus: "0", 
      attack_bonus: "0", 
      quality_desc: "" 
  });

  // --- Funções do Banco de Dados ---
  const handleAddWeapon = (item: any) => {
      const data = item.data || {}; 
      appendWeapon({ 
          name: item.name, 
          damage: data.damage || "1d6", 
          attackAttribute: data.attackAttribute || "vigorous", 
          quality_desc: data.quality ? data.quality : "", 
          is_natural: false
      });
      setIsWeaponSelectorOpen(false);
      toast({ title: "Item Importado", description: `${item.name} equipado.` });
  };

  const handleAddArmor = (item: any) => {
      const data = item.data || {};
      appendArmor({
          name: item.name,
          protection: data.protection || "0",
          obstructive: Number(data.obstructive) || 0,
          equipped: true,
          quality_desc: data.quality ? data.quality : "" 
      });
      setIsArmorSelectorOpen(false);
      toast({ title: "Item Importado", description: `${item.name} equipado.` });
  };

  // ATUALIZADO: Inicializa com attack_bonus
  const handleAddProjectile = (item: any) => {
      const data = item.data || {};
      appendProjectile({
          id: crypto.randomUUID(),
          name: item.name,
          amount: 20, 
          damage_bonus: data.damage || "0", 
          attack_bonus: "0", // Padrão 0, editável na ficha
          quality_desc: data.quality ? data.quality : "" 
      });
      setIsProjectileSelectorOpen(false);
      toast({ title: "Item Importado", description: `${item.name} adicionado.` });
  };

  const handleSmartDamage = (incomingDamage: number) => {
      const dr = calculations.damageReduction;
      if (dr > 0) {
          const finalDamage = Math.max(0, incomingDamage - dr);
          combatLogic.handleDamage(finalDamage);
          toast({ title: "Dano Reduzido", description: `Recebido: ${incomingDamage} - DR: ${dr} = ${finalDamage}` });
      } else {
          combatLogic.handleDamage(incomingDamage);
      }
  };

  const onHeal = (val: number) => combatLogic.handleHeal(val, calculations.toughnessMax);

  const parseQualities = (qualityStr: string) => {
      if (!qualityStr) return [];
      try {
          const parsed = JSON.parse(qualityStr);
          if (Array.isArray(parsed)) return parsed;
          return [qualityStr];
      } catch (e) {
          return [qualityStr];
      }
  };

  const handleAmmoChange = (index: number, change: number) => {
      const current = Number(form.getValues(`projectiles.${index}.amount`)) || 0;
      const newValue = Math.max(0, current + change);
      form.setValue(`projectiles.${index}.amount`, newValue);
  };

  return (
    <div className="space-y-4 h-full flex flex-col overflow-y-auto pb-20"> 
      
      {/* STATUS VITAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
             <CardHeader className="pb-2 pt-4 px-4 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> Defesa</CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                 <FormField control={form.control} name="stats.defense" render={({ field }) => (
                    <div className="relative w-24">
                        <Input {...field} type="number" className="text-4xl font-extrabold text-center h-16 tracking-tighter bg-transparent border-2 border-muted focus:border-primary" placeholder="0"/>
                    </div>
                 )} />
                 <div className="text-xs text-muted-foreground text-center">Modificador</div>
             </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <VitalityCard form={form} max={calculations.toughnessMax} painThreshold={calculations.painThreshold} onDamage={handleSmartDamage} onHeal={onHeal} />
            <Card className="p-2 flex items-center justify-between bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground ml-2">Limiar de Dor:</span>
                <FormField control={form.control} name="stats.pain_threshold" render={({ field }) => (
                    <Input {...field} type="number" className="w-20 h-8 text-center bg-background" placeholder="Pain"/>
                )} />
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <CorruptionCard form={form} threshold={calculations.corruptionThreshold} />
            <Card className="p-2 flex items-center justify-between bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground ml-2">Limiar Corrupção:</span>
                <FormField control={form.control} name="stats.corruption_threshold" render={({ field }) => (
                    <Input {...field} type="number" className="w-20 h-8 text-center bg-background" placeholder="Corr"/>
                )} />
            </Card>
          </div>
      </div>

      {/* ÁREA DE COMBATE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          {/* ARMAS */}
          <Card className="flex flex-col border-t-4 border-t-orange-500 shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Sword className="w-4 h-4 text-orange-500" /> Armas</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsWeaponSelectorOpen(true)}><Database className="w-4 h-4 mr-2" /> Buscar no Banco</DropdownMenuItem>
                        <DropdownMenuItem onClick={addManualWeapon}><PenTool className="w-4 h-4 mr-2" /> Criar Manualmente</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-2 flex-1 space-y-2">
                {weaponFields.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg m-2">Nenhuma arma equipada</div>}
                <Accordion type="multiple" className="space-y-2" value={openWeapons} onValueChange={setOpenWeapons}>
                    {weaponFields.map((field, index) => {
                        const qualities = parseQualities(form.watch(`weapons.${index}.quality_desc`));
                        return (
                        <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                            <div className="flex items-center justify-between py-2">
                                <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1">
                                    <div className="flex flex-col items-start text-left gap-1">
                                        <span className="font-semibold text-sm">{form.watch(`weapons.${index}.name`) || "Nova Arma"}</span>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-muted">{form.watch(`weapons.${index}.damage`)}</Badge>
                                            {qualities.slice(0, 2).map((q: any, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-[9px] h-4 px-1">{typeof q === 'string' ? q : q.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1">
                                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7" onClick={() => combatLogic.prepareNpcAttack(index)}><Dices className="w-4 h-4 text-primary" /></Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => combatLogic.prepareDamage(index)}><Sword className="w-4 h-4" /></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={() => removeWeapon(index)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                            <AccordionContent className="border-t pt-2 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField control={form.control} name={`weapons.${index}.name`} render={({ field }) => (
                                        <div className="space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                    )} />
                                    <FormField control={form.control} name={`weapons.${index}.damage`} render={({ field }) => (
                                        <div className="space-y-1"><FormLabel className="text-[10px]">Dano</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                    )} />
                                </div>
                                <div className="flex gap-2 items-end">
                                    <FormField control={form.control} name={`weapons.${index}.projectileId`} render={({ field }) => (
                                        <FormItem className="flex-1 space-y-1">
                                            <FormLabel className="text-[10px]">Munição</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sem munição" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhuma</SelectItem>
                                                    {projectileFields.map((proj: any) => (
                                                        <SelectItem key={proj.id} value={proj.id}>{proj.name} ({proj.amount})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                                <div>
                                    <FormLabel className="text-[10px] mb-1 block">Qualidades</FormLabel>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {qualities.map((q: any, i: number) => (
                                            <div key={i}><QualityInfoButton qualityName={typeof q === 'string' ? q : q.name} /></div>
                                        ))}
                                    </div>
                                    <FormField control={form.control} name={`weapons.${index}.quality_desc`} render={({ field }) => (
                                       <QualitySelector 
                                            tableId={npc.table_id}
                                            value={field.value}
                                            onChange={field.onChange}
                                            targetType="weapon"
                                       />
                                    )} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )})}
                </Accordion>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
              {/* ARMADURAS */}
              <Card className="flex flex-col border-t-4 border-t-slate-500 shadow-sm">
                <CardHeader className="py-3 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" /> Armaduras</CardTitle>
                        {calculations.damageReduction > 0 && <Badge variant="secondary">DR: {calculations.damageReduction}</Badge>}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsArmorSelectorOpen(true)}><Database className="w-4 h-4 mr-2" /> Buscar no Banco</DropdownMenuItem>
                            <DropdownMenuItem onClick={addManualArmor}><PenTool className="w-4 h-4 mr-2" /> Criar Manualmente</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-2 flex-1">
                    {armorFields.length === 0 && <div className="text-center py-4 text-muted-foreground text-xs">Sem proteção</div>}
                    <div className="space-y-2">
                        {armorFields.map((field, index) => {
                            const qualities = parseQualities(form.watch(`armors.${index}.quality_desc`));
                            return (
                            <div key={field.id} className="border rounded bg-card p-2 space-y-2 relative group">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-semibold text-xs text-muted-foreground">#{index + 1}</span>
                                        {qualities.map((q: any, i: number) => (
                                             <Badge key={i} variant="secondary" className="text-[9px] h-3 px-1">{typeof q === 'string' ? q : q.name}</Badge>
                                        ))}
                                    </div>
                                    <Button type="button" size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeArmor(index)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                                <div className="flex gap-2">
                                    <FormField control={form.control} name={`armors.${index}.name`} render={({ field }) => (
                                        <div className="space-y-1 flex-[2]"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                    )} />
                                    <FormField control={form.control} name={`armors.${index}.protection`} render={({ field }) => (
                                        <div className="space-y-1 flex-1"><FormLabel className="text-[10px]">Defesa</FormLabel><Input {...field} className="h-7 text-xs" type="number" /></div>
                                    )} />
                                </div>
                                <div>
                                    <FormField control={form.control} name={`armors.${index}.quality_desc`} render={({ field }) => (
                                       <QualitySelector 
                                            tableId={npc.table_id}
                                            value={field.value}
                                            onChange={field.onChange}
                                            targetType="armor"
                                       />
                                    )} />
                                </div>
                            </div>
                        )})}
                    </div>
                </CardContent>
              </Card>

              {/* MUNIÇÃO - ATUALIZADO */}
              <Card className="flex flex-col border-t-4 border-t-yellow-600 shadow-sm flex-1">
                <CardHeader className="py-2 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-yellow-600" /> Munição & Projéteis</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Plus className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsProjectileSelectorOpen(true)}><Database className="w-4 h-4 mr-2" /> Buscar no Banco</DropdownMenuItem>
                            <DropdownMenuItem onClick={addManualProjectile}><PenTool className="w-4 h-4 mr-2" /> Criar Manualmente</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-2 space-y-1 overflow-y-auto max-h-[300px]">
                     {projectileFields.length === 0 && <div className="text-center text-xs text-muted-foreground py-2">Sem munição</div>}
                     
                     <Accordion type="multiple" className="space-y-2" value={openProjectiles} onValueChange={setOpenProjectiles}>
                        {projectileFields.map((field, index) => {
                            const qualities = parseQualities(form.watch(`projectiles.${index}.quality_desc`));
                            const currentAmount = form.watch(`projectiles.${index}.amount`);
                            const damageBonus = form.watch(`projectiles.${index}.damage_bonus`);
                            const attackBonus = form.watch(`projectiles.${index}.attack_bonus`);
                            
                            return (
                            <AccordionItem key={field.id} value={field.id} className="border rounded bg-card px-2">
                                <div className="flex items-center justify-between py-2">
                                    <AccordionTrigger className="p-0 hover:no-underline flex-1 py-1 mr-2">
                                        <div className="flex flex-col items-start text-left gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-xs">{form.watch(`projectiles.${index}.name`) || "Munição"}</span>
                                                {/* BADGES VISUAIS NO CABEÇALHO */}
                                                {damageBonus && damageBonus !== "0" && (
                                                    <Badge variant="outline" className="text-[9px] h-3 px-1 border-destructive/50 text-destructive bg-destructive/5">
                                                        +{damageBonus} Dano
                                                    </Badge>
                                                )}
                                                {attackBonus && attackBonus !== "0" && (
                                                    <Badge variant="outline" className="text-[9px] h-3 px-1 border-blue-500/50 text-blue-600 bg-blue-500/5">
                                                        +{attackBonus} Acerto
                                                    </Badge>
                                                )}
                                            </div>
                                            {qualities.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {qualities.slice(0, 2).map((q: any, i: number) => (
                                                        <Badge key={i} variant="secondary" className="text-[9px] h-3 px-1">{typeof q === 'string' ? q : q.name}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>

                                    {/* CONTROLO RÁPIDO DE QUANTIDADE */}
                                    <div className="flex items-center bg-muted/30 rounded border border-border mr-2">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 rounded-r-none hover:bg-destructive/20 hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); handleAmmoChange(index, -1); }}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="text-xs font-mono w-8 text-center font-bold">{currentAmount}</span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 rounded-l-none hover:bg-primary/20 hover:text-primary"
                                            onClick={(e) => { e.stopPropagation(); handleAmmoChange(index, 1); }}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-50 hover:opacity-100" onClick={() => removeProjectile(index)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>

                                <AccordionContent className="border-t pt-2 space-y-3">
                                    <div className="grid grid-cols-6 gap-2">
                                        <FormField control={form.control} name={`projectiles.${index}.name`} render={({ field }) => (
                                            <div className="col-span-4 space-y-1"><FormLabel className="text-[10px]">Nome</FormLabel><Input {...field} className="h-7 text-xs" /></div>
                                        )} />
                                        <FormField control={form.control} name={`projectiles.${index}.amount`} render={({ field }) => (
                                            <div className="col-span-2 space-y-1"><FormLabel className="text-[10px]">Qtd.</FormLabel><Input {...field} type="number" className="h-7 text-xs" /></div>
                                        )} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField control={form.control} name={`projectiles.${index}.damage_bonus`} render={({ field }) => (
                                            <div className="space-y-1">
                                                <FormLabel className="text-[10px] text-destructive">Bónus Dano</FormLabel>
                                                <Input {...field} className="h-7 text-xs" placeholder="+0 ou 1d4" />
                                            </div>
                                        )} />
                                        
                                        {/* NOVO CAMPO: BÓNUS DE ACERTO */}
                                        <FormField control={form.control} name={`projectiles.${index}.attack_bonus`} render={({ field }) => (
                                            <div className="space-y-1">
                                                <FormLabel className="text-[10px] text-blue-600">Bónus Acerto</FormLabel>
                                                <Input {...field} className="h-7 text-xs" placeholder="+0" />
                                            </div>
                                        )} />
                                        
                                        {/* Botões de Ação para Arremesso (Se for granada/adaga) */}
                                        <div className="col-span-2 flex items-end gap-1 pt-1">
                                            <Button type="button" size="sm" variant="secondary" className="h-7 flex-1 text-[10px]" disabled title="Futuro: Rolar arremesso">
                                                <Crosshair className="w-3 h-3 mr-1" /> Arremessar / Usar
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <FormField control={form.control} name={`projectiles.${index}.quality_desc`} render={({ field }) => (
                                           <QualitySelector 
                                                tableId={npc.table_id}
                                                value={field.value}
                                                onChange={field.onChange}
                                                targetType="ammunition" 
                                           />
                                        )} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            );
                        })}
                     </Accordion>
                </CardContent>
              </Card>
          </div>
      </div>

      <ItemSelectorDialog 
          open={isWeaponSelectorOpen} 
          onOpenChange={setIsWeaponSelectorOpen} 
          category="weapon" 
          title="Selecionar Arma"
          tableId={npc.table_id} 
          onSelect={handleAddWeapon} 
      />
      <ItemSelectorDialog 
          open={isArmorSelectorOpen} 
          onOpenChange={setIsArmorSelectorOpen} 
          category="armor" 
          title="Selecionar Armadura"
          tableId={npc.table_id} 
          onSelect={handleAddArmor} 
      />
      <ItemSelectorDialog 
          open={isProjectileSelectorOpen} 
          onOpenChange={setIsProjectileSelectorOpen} 
          category="ammunition" 
          title="Selecionar Munição"
          tableId={npc.table_id} 
          onSelect={handleAddProjectile} 
      />

      {/* Rolagens */}
      {combatLogic.attackRollData && <WeaponAttackDialog open={!!combatLogic.attackRollData} onOpenChange={(o) => !o && combatLogic.setAttackRollData(null)} characterName={npc.name} tableId={npc.table_id} {...combatLogic.attackRollData} />}
      {combatLogic.damageRollData && <WeaponDamageDialog open={!!combatLogic.damageRollData} onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} characterName={npc.name} tableId={npc.table_id} {...combatLogic.damageRollData} />}
    </div>
  );
};