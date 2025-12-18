import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { useToast } from "@/hooks/use-toast";
// CORREÇÃO: Schema do sistema
import { getDefaultWeapon, getDefaultArmor, getDefaultInventoryItem } from "../utils/symbaroum.schema";

export const useEquipmentManager = () => {
  const { form } = useCharacterSheet();
  const { toast } = useToast();

  const equipItem = (inventoryIndex: number, type: 'weapon' | 'armor') => {
    const inventory = form.getValues("inventory");
    const item = inventory[inventoryIndex];

    if (!item) return;

    const newInventory = inventory.filter((_, i) => i !== inventoryIndex);
    form.setValue("inventory", newInventory, { shouldDirty: true });

    if (type === 'weapon') {
        const currentWeapons = form.getValues("weapons") || [];
        const newWeapon = {
            ...getDefaultWeapon(),
            id: item.id || crypto.randomUUID(),
            name: item.name,
            weight: item.weight,
            damage: item.data?.damage || "",
            attribute: item.data?.attribute || "",
            attackAttribute: item.data?.attackAttribute || "quick",
            quality: item.data?.quality || "",
            quality_desc: item.description || ""
        };
        form.setValue("weapons", [...currentWeapons, newWeapon], { shouldDirty: true });
        toast({ title: "Arma Equipada", description: `${item.name} movida para Combate.` });
    } 
    else if (type === 'armor') {
        const currentArmors = form.getValues("armors") || [];
        const newArmor = {
            ...getDefaultArmor(),
            id: item.id || crypto.randomUUID(),
            name: item.name,
            weight: item.weight,
            protection: item.data?.protection || "",
            obstructive: item.data?.obstructive || 0,
            quality: item.data?.quality || "",
            quality_desc: item.description || "",
            equipped: true
        };
        form.setValue("armors", [...currentArmors, newArmor], { shouldDirty: true });
        toast({ title: "Armadura Equipada", description: `${item.name} movida para Combate.` });
    }
  };

  const unequipItem = (index: number, type: 'weapon' | 'armor') => {
    const listName = type === 'weapon' ? 'weapons' : 'armors';
    const list = form.getValues(listName);
    const item = list[index];

    if (!item) return;

    const newList = list.filter((_, i) => i !== index);
    form.setValue(listName, newList, { shouldDirty: true });

    const currentInventory = form.getValues("inventory") || [];
    const newItem = {
        ...getDefaultInventoryItem(),
        id: item.id || crypto.randomUUID(),
        name: item.name,
        weight: Number(item.weight) || 0,
        quantity: 1,
        category: type,
        description: item.quality_desc || "",
        data: {
            quality: item.quality,
            ...(type === 'weapon' ? { 
                damage: item.damage, 
                attackAttribute: item.attackAttribute 
            } : { 
                protection: item.protection, 
                obstructive: item.obstructive 
            })
        }
    };

    form.setValue("inventory", [...currentInventory, newItem], { shouldDirty: true });
    toast({ title: "Desequipado", description: `${item.name} movido para a Mochila.` });
  };

  return { equipItem, unequipItem };
};