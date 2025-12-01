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
    // Adicionado: Campo opcional para suportar vida temporária (padrão PC ou NPC)
    tempToughness?: string;
  };
}

export const useCombatLogic = ({ form, fields }: UseCombatLogicProps) => {
  const { toast } = useToast();
  
  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [damageRollData, setDamageRollData] = useState<DamageRollData | null>(null);
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

  // Campo de vida temporária (usa o prop ou o padrão de PC)
  const tempField = fields.tempToughness || "toughness.temporary";

  // --- LÓGICA DE DANO E CURA (ATUALIZADA) ---

  const handleDamage = (amount: number, armorRD = 0) => {
    const damage = Math.max(0, amount - armorRD);
    
    // Ler valores atuais
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    const temporary = Number(form.getValues(tempField)) || 0;

    let damageRemaining = damage;
    let newTemporary = temporary;

    // 1. Absorver com Vida Temporária primeiro (Escudo/Magia)
    if (newTemporary > 0) {
        if (newTemporary >= damageRemaining) {
            newTemporary -= damageRemaining;
            damageRemaining = 0;
        } else {
            damageRemaining -= newTemporary;
            newTemporary = 0;
        }
    }

    // 2. Aplicar o dano restante à Vida Atual
    const newCurrent = Math.max(0, current - damageRemaining);
    
    // Atualizar formulário
    form.setValue(tempField, newTemporary, { shouldDirty: true });
    form.setValue(fields.currentToughness, newCurrent, { shouldDirty: true });
    
    // Feedback detalhado
    let description = `Dano Real: ${damage}`;
    if (armorRD > 0) description += ` (${amount} - ${armorRD} RD)`;
    description += `. (Temp: ${temporary} -> ${newTemporary}, Vida: ${current} -> ${newCurrent})`;
    
    toast({ title: "Dano Aplicado", description, variant: newCurrent === 0 ? "destructive" : "default" });
  };

  const handleHeal = (amount: number, manualMax?: number) => {
    const current = Number(form.getValues(fields.currentToughness)) || 0;
    // Usa o manualMax se passado (útil para NPCs), senão tenta ler do formulário
    const max = manualMax ?? (Number(form.getValues(fields.maxToughness)) || 10);
    
    const newValue = Math.min(max, current + amount);
    
    form.setValue(fields.currentToughness, newValue, { shouldDirty: true });
    toast({ title: "Cura Aplicada", description: `+${amount} Vitalidade (Atual: ${newValue}/${max}).` });
  };

  // --- LÓGICA DE ATAQUE DO JOGADOR (PRESERVADA) ---
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

        // Aplica Bônus do Projétil
        if (projectile.attack_modifier) {
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
      ? Number(allAttributes[selectedAttr.key as keyof typeof allAttributes]?.value || allAttributes[selectedAttr.key as keyof typeof allAttributes]) || 0 
      : 0;

    if (baseAttributeValue === 0 && !selectedAttr) {
      // Se não achar atributo, assume 0 mas deixa rolar (fallback)
      // toast({ title: "Aviso", description: "Atributo de ataque não encontrado ou zero." });
    }

    // Soma o bônus ao atributo base
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
    
    // Dano Base da Arma + Bônus (Amoque)
    if (bonusDice) {
        finalDamage += `+${bonusDice}`;
    }

    // Aplica Dano Extra do Projétil
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
    consumeProjectile
  };
};