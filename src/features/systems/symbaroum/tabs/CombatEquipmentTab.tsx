import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // CORRIGIDO
import { useFieldArray } from "react-hook-form"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Shield, Sword, Dices, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// CORREÇÃO: Imports do Sistema
import { useSymbaroumCalculations } from "../hooks/useSymbaroumCalculations";
// import { useEquipmentManager } from "../hooks/useEquipmentManager"; // Descomente se existir
import { getDefaultWeapon, getDefaultArmor } from "../utils/symbaroum.schema";
import { useTableContext } from "@/features/table/TableContext";
import { parseDiceRoll } from "@/lib/dice-parser";
import { formatProtectionRoll } from "../utils/symbaroum-dice"; // CORRIGIDO

import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { VitalityCard } from "../combat/components/VitalityCard"; // CORRIGIDO
import { CorruptionCard } from "../combat/components/CorruptionCard"; // CORRIGIDO
import { DefenseRollDialog } from "../components/DefenseRollDialog"; // CORRIGIDO
import { useCombatLogic } from "../hooks/useCombatLogic"; // CORRIGIDO
import { WeaponAttackDialog } from "../components/WeaponAttackDialog"; // CORRIGIDO
import { WeaponDamageDialog } from "../components/WeaponDamageDialog"; // CORRIGIDO

// Componentes Visuais
import { WeaponCard } from "../combat/components/WeaponCard"; // CORRIGIDO
import { ArmorCard } from "../combat/components/ArmorCard"; // CORRIGIDO

export const CombatEquipmentTab = () => {
  const { form, character } = useCharacterSheet();
  const { tableId } = useTableContext();
  const { toast } = useToast();
  
  // 1. Hooks de Cálculo (Com suporte a Amoque/Façanha de Força)
  const { 
    toughnessMax, 
    painThreshold, 
    activeBerserk, 
    featOfStrength,
    isBloodied,
    totalDefense, 
    corruptionThreshold 
  } = useSymbaroumCalculations();

  // 2. Lógica de Combate (Passando os buffs)
  const combatLogic = useCombatLogic({ 
      form, 
      fields: { currentToughness: "toughness.current", maxToughness: "toughness.max" },
      activeBerserk,
      featOfStrength,
      isBloodied
  });

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({ control: form.control, name: "weapons" });
  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({ control: form.control, name: "armors" });
  
  const projectiles = form.watch("projectiles") || [];

  const onDamage = (val: number) => combatLogic.handleDamage(val);
  const onHeal = (val: number) => combatLogic.handleHeal(val, toughnessMax);

  const handleProtectionRoll = async (index: number) => {
    const armor = form.getValues(`armors.${index}`);
    let protectionString = armor.protection || "0";
    
    // Lógica de Amoque (Adepto/Mestre)
    if (activeBerserk && (activeBerserk.level === 'Adepto' || activeBerserk.level === 'Mestre')) {
         protectionString += "+1d4"; 
         toast({ title: "Pele de Ferro", description: "Amoque ativo: +1d4 proteção." }); 
    }
    
    const roll = parseDiceRoll(protectionString);
    if (!roll) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        toast({ title: `Proteção: ${armor.name}`, description: `Resultado: ${roll.total}` });
        await supabase.from("chat_messages").insert({ 
            table_id: character.table_id, 
            user_id: user.id, 
            message: formatProtectionRoll(character.name, armor.name, roll), 
            message_type: "roll" 
        });
        
        const discordRollData = { rollType: "protection", armorName: armor.name, result: roll };
        supabase.functions.invoke('discord-roll-handler', { 
            body: { tableId: character.table_id, rollData: discordRollData, userName: character.name } 
        }).catch(console.error);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      
      {/* 1. PAINEL SUPERIOR: STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* DEFESA */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-blue-500/5 h-full">
             <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                 <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase font-bold tracking-widest mb-1">
                    <Shield className="w-4 h-4" /> Defesa Total
                 </div>
                 <div className="text-6xl font-black text-foreground tracking-tighter drop-shadow-sm">
                    {totalDefense}
                 </div>
                 <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="w-full mt-auto gap-2 font-semibold" 
                    onClick={() => combatLogic.setIsDefenseRollOpen(true)}
                 >
                    <Dices className="w-4 h-4" /> Rolar Defesa
                 </Button>
             </CardContent>
          </Card>

          {/* VITALIDADE */}
          <VitalityCard 
            form={form}
            max={toughnessMax}
            painThreshold={painThreshold}
            onDamage={onDamage}
            onHeal={onHeal}
          />

          {/* CORRUPÇÃO */}
          <CorruptionCard 
            form={form} 
            threshold={corruptionThreshold} 
          />
      </div>

      {/* 2. ARSENAL (GRID DE ARMAS) */}
      <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sword className="w-5 h-5 text-orange-500" /> Arsenal
              </h3>
              <ItemSelectorDialog tableId={tableId} categories={['weapon']} onSelect={(template) => {
                  if (template) {
                      const quality = template.data.quality || "";
                      const desc = template.description || template.data.quality_desc || "";
                      appendWeapon({ ...getDefaultWeapon(), name: template.name, damage: template.data.damage || "", attackAttribute: template.data.attackAttribute || "", quality: quality, quality_desc: desc, weight: template.weight || 1 });
                  } else {
                      appendWeapon(getDefaultWeapon());
                  }
              }}>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <Plus className="w-4 h-4" /> Adicionar Arma
                  </Button>
              </ItemSelectorDialog>
          </div>

          {weaponFields.length === 0 ? (
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p>Nenhuma arma equipada.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weaponFields.map((field, index) => (
                      <WeaponCard 
                          key={field.id} 
                          index={index} 
                          tableId={tableId}
                          projectiles={projectiles}
                          onAttack={() => combatLogic.preparePcAttack(index)}
                          onDamage={() => combatLogic.prepareDamage(index)}
                          onRemove={() => removeWeapon(index)}
                          control={form.control} 
                      />
                  ))}
              </div>
          )}
      </div>

      {/* 3. ARMADURA & PROTEÇÃO */}
      <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" /> Proteção
              </h3>
              <ItemSelectorDialog tableId={tableId} categories={['armor']} onSelect={(template) => {
                  if(template) appendArmor({ ...getDefaultArmor(), name: template.name, protection: template.data.protection, obstructive: template.data.obstructive, quality: template.data.quality, quality_desc: template.description, weight: template.weight });
                  else appendArmor(getDefaultArmor());
              }}>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-slate-600 hover:text-slate-700 hover:bg-slate-50">
                      <Plus className="w-4 h-4" /> Adicionar Armadura
                  </Button>
              </ItemSelectorDialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {armorFields.length === 0 && (
                  <div className="col-span-full border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                      Personagem sem proteção.
                  </div>
              )}
              {armorFields.map((field, index) => (
                  <ArmorCard 
                      key={field.id} 
                      index={index} 
                      tableId={tableId}
                      onRoll={() => handleProtectionRoll(index)}
                      onRemove={() => removeArmor(index)}
                  />
              ))}
          </div>
      </div>

      {/* DIÁLOGOS DE ROLAGEM */}
      {combatLogic.attackRollData && <WeaponAttackDialog open={!!combatLogic.attackRollData} onOpenChange={(o) => !o && combatLogic.setAttackRollData(null)} characterName={character.name} tableId={character.table_id} {...combatLogic.attackRollData} onConfirm={() => combatLogic.consumeProjectile(combatLogic.attackRollData?.projectileId)} />}
      {combatLogic.damageRollData && <WeaponDamageDialog open={!!combatLogic.damageRollData} onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} characterName={character.name} tableId={character.table_id} {...combatLogic.damageRollData} />}
      <DefenseRollDialog open={combatLogic.isDefenseRollOpen} onOpenChange={combatLogic.setIsDefenseRollOpen} defenseValue={totalDefense} characterName={character.name} tableId={character.table_id} />
    
    </div>
  );
};