// CORREÇÃO: Importar o contexto do Symbaroum
import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext";
import { useFieldArray } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Sword, Shield, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { FormControl, FormField } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

// CORREÇÃO: Imports relativos ajustados
import { useNpcCalculations } from "../hooks/useNpcCalculations";
import { getDefaultNpcWeapon, getDefaultNpcArmor } from "../npc.schema"; 

// Componentes Partilhados (Assumindo que estão nestes caminhos globais)
import { NpcVitalityCard } from "@/features/combat/components/NpcVitalityCard";
import { NpcCorruptionCard } from "@/features/combat/components/NpcCorruptionCard";
import { useCombatLogic } from "@/features/combat/hooks/useCombatLogic";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";
import { WeaponCard } from "@/features/combat/components/WeaponCard";
import { NpcArmorCard } from "@/features/combat/components/NpcArmorCard"; 
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";

export const NpcCombatEquipmentTab = () => {
  // CORREÇÃO: Usar o hook do Symbaroum
  const { form, npc } = useSymbaroumNpcSheet();
  const { toast } = useToast();
  
  // Cálculos
  const { toughnessMax, damageReduction, painThreshold } = useNpcCalculations();

  // Lógica de Combate
  const combatLogic = useCombatLogic({ 
      form, 
      fields: { currentToughness: "combat.toughness_current", maxToughness: "combat.toughness_max" },
      activeBerserk: undefined,
      featOfStrength: undefined,
      isBloodied: false 
  });

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });
  
  // Lista de projéteis (assumindo que existe no form)
  const projectiles = form.watch("projectiles") || [];

  const onDamage = (val: number) => {
      combatLogic.handleDamage(val, damageReduction);
      if (damageReduction > 0) {
          toast({ description: `Armadura absorveu ${damageReduction} de dano.` });
      }
  };
  const onHeal = (val: number) => combatLogic.handleHeal(val, toughnessMax);

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      
      {/* 1. STATUS ESTATÍSTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* DEFESA & ARMADURA (Manual) */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm bg-gradient-to-br from-card to-blue-500/5 relative overflow-hidden flex flex-col h-full">
             <CardContent className="p-0 flex flex-col h-full">
                 <div className="p-4 pb-2 text-center relative flex-1 flex flex-col justify-center min-h-[100px]">
                     <div className="flex items-center justify-center gap-2 text-blue-600/80 text-xs uppercase font-bold tracking-widest mb-1">
                        <Shield className="w-4 h-4" /> Defesa
                     </div>
                     <FormField control={form.control} name="combat.defense" render={({ field }) => (
                         <FormControl>
                             <div className="relative inline-block w-full">
                                 <Input 
                                    type="number" 
                                    {...field} 
                                    className="text-7xl font-black text-center h-20 w-full border-none bg-transparent focus-visible:ring-0 p-0 shadow-none text-foreground tracking-tighter z-10 relative"
                                    placeholder="0"
                                    onChange={e => field.onChange(e.target.value)}
                                 />
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-blue-500/5 font-black select-none -z-0 pointer-events-none">
                                     <Shield className="w-32 h-32 opacity-20" />
                                 </div>
                             </div>
                         </FormControl>
                     )}/>
                 </div>
                 <div className="px-6"><Separator className="bg-blue-500/20" /></div>
                 <div className="p-3 bg-blue-500/10 mt-auto">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-full">
                                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">Redução de Dano</span>
                                <span className="text-[9px] text-blue-600/70 dark:text-blue-400/70 leading-none">Automática</span>
                            </div>
                        </div>
                        <span className="text-3xl font-black text-blue-700 dark:text-blue-300 tabular-nums">
                            {damageReduction}
                        </span>
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* VITALIDADE NPC */}
          <NpcVitalityCard 
              form={form} 
              control={form.control} 
              max={toughnessMax}
              onDamage={onDamage}
              onHeal={onHeal}
              painThreshold={painThreshold}
          />

          {/* CORRUPÇÃO NPC */}
          <NpcCorruptionCard form={form} />
      </div>

      {/* 2. ARSENAL */}
      <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sword className="w-5 h-5 text-orange-500" /> Arsenal
              </h3>
              <ItemSelectorDialog tableId={npc.table_id} categories={['weapon']} onSelect={(template) => {
                  if (template) {
                      const quality = template.data.quality || "";
                      const desc = template.description || template.data.quality_desc || "";
                      appendWeapon({ ...getDefaultNpcWeapon(), name: template.name, damage: template.data.damage || "", attackAttribute: template.data.attackAttribute || "", quality: quality, quality_desc: desc, weight: template.weight || 1 });
                  } else {
                      appendWeapon(getDefaultNpcWeapon());
                  }
              }}>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <Plus className="w-4 h-4" /> Adicionar Ataque
                  </Button>
              </ItemSelectorDialog>
          </div>

          {weaponFields.length === 0 ? (
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p>Sem ataques definidos.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weaponFields.map((field, index) => (
                      <WeaponCard 
                          key={field.id} 
                          index={index} 
                          tableId={npc.table_id}
                          projectiles={projectiles}
                          onAttack={() => combatLogic.prepareNpcAttack(index)}
                          onDamage={() => combatLogic.prepareDamage(index)}
                          onRemove={() => removeWeapon(index)}
                          control={form.control}
                      />
                  ))}
              </div>
          )}
      </div>

      {/* 3. ARMADURA FIXA */}
      <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" /> Armadura Natural / Equip.
              </h3>
              <ItemSelectorDialog tableId={npc.table_id} categories={['armor']} onSelect={(template) => {
                  if(template) appendArmor({ ...getDefaultNpcArmor(), name: template.name, protection: template.data.protection, obstructive: template.data.obstructive, quality: template.data.quality, quality_desc: template.description, weight: template.weight });
                  else appendArmor(getDefaultNpcArmor());
              }}>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-slate-600 hover:text-slate-700 hover:bg-slate-50">
                      <Plus className="w-4 h-4" /> Adicionar Armadura
                  </Button>
              </ItemSelectorDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {armorFields.length === 0 && (
                  <div className="col-span-full border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Sem proteção definida.
                  </div>
              )}
              {armorFields.map((field, index) => (
                  <NpcArmorCard 
                      key={field.id} 
                      index={index} 
                      tableId={npc.table_id}
                      onRemove={() => removeArmor(index)}
                      control={form.control} 
                  />
              ))}
          </div>
      </div>

      {/* DIÁLOGOS DE ROLAGEM */}
      {combatLogic.attackRollData && (
          <WeaponAttackDialog 
              open={!!combatLogic.attackRollData} 
              onOpenChange={(o) => !o && combatLogic.setAttackRollData(null)} 
              characterName={npc.name} 
              tableId={npc.table_id} 
              {...combatLogic.attackRollData} 
              onConfirm={() => combatLogic.consumeProjectile(combatLogic.attackRollData?.projectileId)}
          />
      )}
      {combatLogic.damageRollData && <WeaponDamageDialog open={!!combatLogic.damageRollData} onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} characterName={npc.name} tableId={npc.table_id} {...combatLogic.damageRollData} />}
    
    </div>
  );
};