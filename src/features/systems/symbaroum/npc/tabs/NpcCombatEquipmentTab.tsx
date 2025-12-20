import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext";
import { useToast } from "@/hooks/use-toast";

// Hooks de Lógica
import { useNpcCalculations } from "../hooks/useNpcCalculations";
import { useCombatLogic } from "@/features/systems/symbaroum/hooks/useCombatLogic";

// Componentes Modulares (Agora usados corretamente!)
import { NpcCombatStats } from "./combat/NpcCombatStats";
import { NpcArsenalSection } from "./combat/NpcArsenalSection";
import { NpcArmorSection } from "./combat/NpcArmorSection";

// Diálogos de Rolagem
import { WeaponAttackDialog } from "@/features/systems/symbaroum/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/features/systems/symbaroum/components/WeaponDamageDialog";

export const NpcCombatEquipmentTab = () => {
  const { form, npc } = useSymbaroumNpcSheet();
  const { toast } = useToast();
  
  // 1. Cálculos Automáticos (Vêm do useNpcCalculations)
  const { toughnessMax, damageReduction, painThreshold } = useNpcCalculations();

  // 2. Lógica de Ações de Combate
  const combatLogic = useCombatLogic({ 
      form, 
      fields: { currentToughness: "combat.toughness_current", maxToughness: "combat.toughness_max" },
      // Passamos undefined pois NPCs tratam isso no cálculo interno ou podemos expandir depois
      activeBerserk: undefined,
      featOfStrength: undefined,
      isBloodied: false 
  });

  const onDamage = (val: number) => {
      combatLogic.handleDamage(val, damageReduction);
      if (damageReduction > 0) {
          toast({ description: `Armadura absorveu ${damageReduction} de dano.` });
      }
  };
  
  const onHeal = (val: number) => combatLogic.handleHeal(val, toughnessMax);

  return (
    <div className="space-y-8 h-full flex flex-col pb-10">
      
      {/* SEÇÃO 1: ESTATÍSTICAS VITAIS */}
      <NpcCombatStats 
          toughnessMax={toughnessMax}
          damageReduction={damageReduction}
          painThreshold={painThreshold}
          onDamage={onDamage}
          onHeal={onHeal}
      />

      {/* SEÇÃO 2: ARSENAL (Armas e Ataques) */}
      <NpcArsenalSection combatLogic={combatLogic} />

      {/* SEÇÃO 3: PROTEÇÃO (Armaduras) */}
      <NpcArmorSection />

      {/* DIÁLOGOS (Popups de rolagem) */}
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
      
      {combatLogic.damageRollData && (
          <WeaponDamageDialog 
              open={!!combatLogic.damageRollData} 
              onOpenChange={(o) => !o && combatLogic.setDamageRollData(null)} 
              characterName={npc.name} 
              tableId={npc.table_id} 
              {...combatLogic.damageRollData} 
          />
      )}
    
    </div>
  );
};