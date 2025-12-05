import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { attributesList } from "@/features/character/character.constants";
import { useCharacterCalculations } from "@/features/character/hooks/useCharacterCalculations";

export type AttackRollData = {
  weaponName: string;
  attributeName: string;
  attributeValue: number;
  projectileId?: string;
  abilityName?: string;
};

export type DamageRollData = {
  weaponName: string;
  damageString: string;
};

interface UseCombatLogicProps {
  form: UseFormReturn<any>;
  fields: {
    currentToughness: string;
    maxToughness: string;
    tempToughness?: string;
  };
}

export const useCombatLogic = ({ form, fields }: UseCombatLogicProps) => {
  const { toast } = useToast();
  
  // Importar dados das habilidades
  const { activeBerserk, featOfStrength, isBloodied } = useCharacterCalculations();

  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [damageRollData, setDamageRollData] = useState<DamageRollData | null>(null);
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

  const tempField = fields.tempToughness || "toughness.temporary";

  const handleDamage = (amount: number, armorRD = 0) => {
    const damage = Math.max(0, amount - armorRD);
    
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    const temporary = Number(form.getValues(tempField)) || 0;

    let damageRemaining = damage;
    let newTemporary = temporary;

    if (newTemporary > 0) {
        if (newTemporary >= damageRemaining) {
            newTemporary -= damageRemaining;
            damageRemaining = 0;
        } else {
            damageRemaining -= newTemporary;
            newTemporary = 0;
        }
    }

    const newCurrent = Math.max(0, current - damageRemaining);
    
    form.setValue(tempField, newTemporary, { shouldDirty: true, shouldTouch: true });
    form.setValue(fields.currentToughness, newCurrent, { shouldDirty: true, shouldTouch: true });
    
    let description = `Dano Real: ${damage}`;
    if (armorRD > 0) description += ` (${amount} - ${armorRD} RD)`;
    description += `. (Temp: ${temporary} -> ${newTemporary}, Vida: ${current} -> ${newCurrent})`;
    
    toast({ title: "Dano Aplicado", description, variant: newCurrent === 0 ? "destructive" : "default" });
  };

  const handleHeal = (amount: number, manualMax?: number) => {
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    const max = manualMax ?? (Number(form.getValues(fields.maxToughness)) || 10);
    
    const newValue = Math.min(max, current + amount);
    
    form.setValue(fields.currentToughness, newValue, { shouldDirty: true, shouldTouch: true });
    toast({ title: "Cura Aplicada", description: `+${amount} Vitalidade (Atual: ${newValue}/${max}).` });
  };

  const preparePcAttack = (weaponIndex: number) => {
    const weapon = form.getValues(`weapons.${weaponIndex}`);
    let attackModifier = 0;
    
    if (weapon.projectileId && weapon.projectileId !== "none") {
        const projectiles = form.getValues("projectiles") || [];
        const projIndex = projectiles.findIndex((p: any) => p.id === weapon.projectileId);

        if (projIndex === -1) {
            toast({ title: "Erro de Munição", description: "O projétil configurado não existe na mochila.", variant: "destructive" });
            return;
        }

        const projectile = projectiles[projIndex];
        const currentQty = projectile.quantity || 0;

        if (currentQty <= 0) {
            toast({ 
                title: "Sem Munição!", 
                description: `Você não tem mais ${projectile.name}.`, 
                variant: "destructive" 
            });
            return; 
        }

        if (projectile.attack_modifier) {
            const mod = parseInt(projectile.attack_modifier, 10);
            if (!isNaN(mod)) {
                attackModifier += mod;
                toast({ title: "Bônus de Munição", description: `+${mod} no atributo devido a ${projectile.name}.` });
            }
        }
    }

    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === weapon.attackAttribute);
    
    const baseAttributeValue = selectedAttr 
      ? Number(allAttributes[selectedAttr.key as keyof typeof allAttributes]?.value || allAttributes[selectedAttr.key as keyof typeof allAttributes]) || 0 
      : 0;

    const finalAttributeValue = baseAttributeValue + attackModifier;

    setAttackRollData({
      weaponName: weapon.name || "Arma",
      attributeName: selectedAttr?.label || "Atributo",
      attributeValue: finalAttributeValue,
      projectileId: weapon.projectileId
    });
  };

  const consumeProjectile = (projectileId?: string) => {
      if (!projectileId || projectileId === "none") return;

      const projectiles = form.getValues("projectiles") || [];
      const projIndex = projectiles.findIndex((p: any) => p.id === projectileId);

      if (projIndex !== -1) {
          const currentQty = projectiles[projIndex].quantity || 0;
          if (currentQty > 0) {
              form.setValue(`projectiles.${projIndex}.quantity`, currentQty - 1, { shouldDirty: true, shouldTouch: true });
              toast({ title: "Munição Gasta", description: `1x ${projectiles[projIndex].name} consumido. Restam: ${currentQty - 1}` });
          }
      }
  };

  const prepareNpcAttack = (weaponIndex: number) => {
    const weapon = form.getValues(`weapons.${weaponIndex}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === weapon.attackAttribute);
    
    const attributeValue = selectedAttr 
        ? Number(allAttributes[selectedAttr.key]?.value) || 0 
        : 0;

    setAttackRollData({
      abilityName: weapon.name || "Ataque",
      weaponName: weapon.name,
      attributeName: selectedAttr?.label || "Atributo",
      attributeValue,
    });
  };

  const prepareDamage = (weaponIndex: number, bonusDice = "") => {
    const weapon = form.getValues(`weapons.${weaponIndex}`);
    if (!weapon.damage) {
      toast({ title: "Sem Dano", description: "Esta arma não tem dano definido.", variant: "destructive" });
      return;
    }
    let finalDamage = weapon.damage;
    
    if (bonusDice) {
        finalDamage += `+${bonusDice}`;
    }

    // 1. LÓGICA DE AMOQUE (BERSERK)
    if (activeBerserk && activeBerserk.isActive) {
        finalDamage += "+1d6";
        toast({ title: "Fúria Amoque!", description: "+1d6 de dano (Berserk Ativo)." });
    }

    // 2. LÓGICA DE FAÇANHA DE FORÇA (MESTRE)
    // Requer nível Mestre e estar "Ensanguentado" (HP <= 50%)
    if (featOfStrength && featOfStrength.isActive && featOfStrength.level === "Mestre") {
        if (isBloodied) {
            finalDamage += "+1d4";
            toast({ title: "Façanha de Força!", description: "Ferido e perigoso: +1d4 de dano." });
        }
    }

    // 3. Munição
    if (weapon.projectileId && weapon.projectileId !== "none") {
        const projectiles = form.getValues("projectiles") || [];
        const projectile = projectiles.find((p: any) => p.id === weapon.projectileId);
        
        if (projectile && projectile.damage) {
             const projDmg = projectile.damage.trim();
             if (projDmg.startsWith("+") || projDmg.startsWith("-")) {
                 finalDamage += projDmg;
             } else {
                 finalDamage += `+${projDmg}`;
             }
             toast({ title: "Dano de Munição", description: `${projDmg} adicionado.` });
        }
    }

    if (bonusDice) {
        toast({ title: "Bônus Aplicado", description: `+${bonusDice} ao dano base.` });
    }

    setDamageRollData({ weaponName: weapon.name, damageString: finalDamage });
  };

  return {
    attackRollData,
    setAttackRollData,
    damageRollData,
    setDamageRollData,
    isDefenseRollOpen,
    setIsDefenseRollOpen,
    
    handleDamage,
    handleHeal,
    preparePcAttack,
    prepareNpcAttack,
    prepareDamage,
    consumeProjectile,
    activeBerserk 
  };
};