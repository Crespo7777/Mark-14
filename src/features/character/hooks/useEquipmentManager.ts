import { useCharacterSheet } from "../CharacterSheetContext";
import { getDefaultWeapon, getDefaultArmor } from "../character.schema";
import { useToast } from "@/hooks/use-toast";

export const useEquipmentManager = () => {
  const { form } = useCharacterSheet();
  const { toast } = useToast();

  // --- HELPER: Obter listas atuais ---
  const getInventory = () => form.getValues("inventory") || [];
  const getWeapons = () => form.getValues("weapons") || [];
  const getArmors = () => form.getValues("armors") || [];

  // --- AÇÃO 1: EQUIPAR ITEM (Mochila -> Corpo) ---
  const equipItem = (inventoryIndex: number, type: 'weapon' | 'armor') => {
    const currentInv = getInventory();
    const item = currentInv[inventoryIndex];

    if (!item) return;

    // 1. Validações
    if (type === 'weapon') {
        const currentWeapons = getWeapons();
        if (currentWeapons.length >= 2) {
            toast({ 
                title: "Limite Atingido", 
                description: "Você já tem 2 armas equipadas. Desequipe uma primeiro.", 
                variant: "destructive" 
            });
            return;
        }
    }

    // 2. Remover da Mochila (ou reduzir quantidade)
    const currentQty = Number(item.quantity) || 1;
    let newInventory = [...currentInv];

    if (currentQty > 1) {
        // Reduz quantidade se houver pilha
        newInventory[inventoryIndex] = { ...item, quantity: currentQty - 1 };
    } else {
        // Remove item se for o último
        newInventory = newInventory.filter((_, i) => i !== inventoryIndex);
    }

    // 3. Adicionar à Lista de Equipamento (Weapon ou Armor)
    if (type === 'weapon') {
        const newWeapon = {
            ...getDefaultWeapon(),
            name: item.name,
            damage: item.data?.damage || "1d4", // Fallback seguro
            attribute: item.data?.attribute || item.data?.attackAttribute || "Vigoroso",
            quality: item.data?.quality || "",
            quality_desc: item.description || "",
            weight: Number(item.weight) || 0, // Mantém o peso para referência
        };
        form.setValue("weapons", [...getWeapons(), newWeapon], { shouldDirty: true });
        toast({ title: "Arma Equipada", description: `${item.name} pronta para combate.` });
    } 
    else if (type === 'armor') {
        const newArmor = {
            ...getDefaultArmor(),
            name: item.name,
            protection: item.data?.protection || "1d4",
            obstructive: Number(item.data?.obstructive) || 0,
            quality: item.data?.quality || "",
            quality_desc: item.description || "",
            weight: Number(item.weight) || 0,
            equipped: true // Armaduras já entram vestidas por padrão
        };
        form.setValue("armors", [...getArmors(), newArmor], { shouldDirty: true });
        toast({ title: "Armadura Equipada", description: `${item.name} vestida.` });
    }

    // Atualiza o inventário final
    form.setValue("inventory", newInventory, { shouldDirty: true });
  };

  // --- AÇÃO 2: DESEQUIPAR ITEM (Corpo -> Mochila) ---
  const unequipItem = (equipIndex: number, type: 'weapon' | 'armor') => {
    // 1. Identificar o item a remover
    let itemToMove: any = null;
    
    if (type === 'weapon') {
        const weapons = getWeapons();
        itemToMove = weapons[equipIndex];
        const newWeapons = weapons.filter((_, i) => i !== equipIndex);
        form.setValue("weapons", newWeapons, { shouldDirty: true });
    } 
    else if (type === 'armor') {
        const armors = getArmors();
        itemToMove = armors[equipIndex];
        const newArmors = armors.filter((_, i) => i !== equipIndex);
        form.setValue("armors", newArmors, { shouldDirty: true });
    }

    if (!itemToMove) return;

    // 2. Criar objeto para a Mochila
    // Precisamos "reconstruir" o formato do inventário
    const backpackItem = {
        id: crypto.randomUUID(),
        name: itemToMove.name,
        category: type, // 'weapon' ou 'armor'
        weight: Number(itemToMove.weight) || 0,
        quantity: 1,
        description: itemToMove.quality_desc || "",
        data: {
            // Preserva os stats importantes no campo 'data'
            damage: itemToMove.damage,
            protection: itemToMove.protection,
            obstructive: itemToMove.obstructive,
            quality: itemToMove.quality,
            attribute: itemToMove.attribute || itemToMove.attackAttribute
        }
    };

    // 3. Adicionar à Mochila
    // (Opcional: Poderíamos verificar se já existe para empilhar, mas criar novo é mais seguro para dados únicos)
    const currentInv = getInventory();
    form.setValue("inventory", [...currentInv, backpackItem], { shouldDirty: true });

    toast({ title: "Item Guardado", description: `${itemToMove.name} voltou para a mochila.` });
  };

  return {
    equipItem,
    unequipItem
  };
};