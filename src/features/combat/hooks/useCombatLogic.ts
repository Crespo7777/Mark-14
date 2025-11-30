import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { attributesList } from "@/features/character/character.constants";

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
  };
}

export const useCombatLogic = ({ form, fields }: UseCombatLogicProps) => {
  const { toast } = useToast();
  
  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [damageRollData, setDamageRollData] = useState<DamageRollData | null>(null);
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

  const handleDamage = (amount: number, armorRD = 0) => {
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    const actualDamage = Math.max(0, amount - armorRD);
    const newValue = Math.max(0, current - actualDamage);
    
    form.setValue(fields.currentToughness, newValue, { shouldDirty: true });
    
    let description = `-${actualDamage} Vitalidade.`;
    if (armorRD > 0) description += ` (${amount} - ${armorRD} RD)`;
    
    toast({ title: "Dano Aplicado", description });
  };

  const handleHeal = (amount: number, manualMax?: number) => {
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    const max = manualMax ?? (Number(form.getValues(fields.maxToughness)) || 10);
    const newValue = Math.min(max, current + amount);
    
    form.setValue(fields.currentToughness, newValue, { shouldDirty: true });
    toast({ title: "Cura Aplicada", description: `+${amount} Vitalidade.` });
  };

  // --- LÓGICA DE ATAQUE DO JOGADOR ---
  const preparePcAttack = (weaponIndex: number) => {
    const weapon = form.getValues(`weapons.${weaponIndex}`);
    let attackModifier = 0; // Bônus acumulado
    
    // 1. Verificar Munição
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

        // --- AQUI APLICA O BÔNUS DO PROJÉTIL ---
        if (projectile.attack_modifier) {
            // Tenta converter string "+1" ou "1" para número
            const mod = parseInt(projectile.attack_modifier, 10);
            if (!isNaN(mod)) {
                attackModifier += mod;
                toast({ title: "Bônus de Munição", description: `+${mod} no atributo devido a ${projectile.name}.` });
            }
        }
    }

    // 2. Preparar Atributos
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === weapon.attackAttribute);
    
    const baseAttributeValue = selectedAttr 
      ? Number(allAttributes[selectedAttr.key as keyof typeof allAttributes]) || 0 
      : 0;

    if (baseAttributeValue === 0) {
      toast({ title: "Atributo Inválido", description: "Verifique o atributo de ataque da arma.", variant: "destructive" });
      return;
    }

    // Soma o bônus ao atributo base (Ex: 15 + 1 = 16)
    const finalAttributeValue = baseAttributeValue + attackModifier;

    setAttackRollData({
      weaponName: weapon.name || "Arma",
      attributeName: selectedAttr?.label || "N/D",
      attributeValue: finalAttributeValue, // Passa o valor já modificado
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
              form.setValue(`projectiles.${projIndex}.quantity`, currentQty - 1, { shouldDirty: true });
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

    if (attributeValue === 0) {
      toast({ title: "Atributo Inválido", description: "NPC sem valor no atributo de ataque.", variant: "destructive" });
      return;
    }

    setAttackRollData({
      abilityName: weapon.name || "Ataque",
      weaponName: weapon.name,
      attributeName: selectedAttr?.label || "N/D",
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
    
    // Dano Base da Arma + Bônus (Amoque)
    if (bonusDice) {
        finalDamage += `+${bonusDice}`;
    }

    // --- AQUI APLICA O DANO EXTRA DO PROJÉTIL ---
    if (weapon.projectileId && weapon.projectileId !== "none") {
        const projectiles = form.getValues("projectiles") || [];
        const projectile = projectiles.find((p: any) => p.id === weapon.projectileId);
        
        if (projectile && projectile.damage) {
             // Concatena dano extra (ex: "1d8" virou "1d8+1d4")
             // Se já tem '+', usa direto, senão adiciona
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
    consumeProjectile
  };
};