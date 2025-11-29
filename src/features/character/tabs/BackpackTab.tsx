import { useState, useEffect } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Coins, Gem, TrendingUp, Weight, 
  Package, Plus, Trash2, Sword, Shield, Backpack, Edit, Save 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SharedProjectileList } from "@/components/SharedProjectileList";
import { useToast } from "@/hooks/use-toast";
import { 
  getDefaultWeapon, 
  getDefaultArmor, 
} from "../character.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { QualitySelector } from "@/components/QualitySelector";

// --- LISTA COMPLETA DE CATEGORIAS ---
const INVENTORY_CATEGORIES = [
  { id: 'general', label: 'Geral' },
  { id: 'weapon', label: 'Arma' },
  { id: 'armor', label: 'Armadura' },
  { id: 'consumable', label: 'Elixir/Consumível' },
  { id: 'container', label: 'Recipiente' },
  { id: 'ammunition', label: 'Munição' },
  { id: 'tool', label: 'Ferramenta' },
  { id: 'spec_tool', label: 'Ferramenta Esp.' },
  { id: 'clothing', label: 'Roupa' },
  { id: 'food', label: 'Comida' },
  { id: 'mount', label: 'Montaria' },
  { id: 'animal', label: 'Animal' },
  { id: 'construction', label: 'Construção' },
  { id: 'trap', label: 'Armadilha' },
  { id: 'artifact', label: 'Artefato' },
  { id: 'musical', label: 'Musical' },
  { id: 'asset', label: 'Provento/Tesouro' },
  { id: 'material', label: 'Material' },
];

// --- COMPONENTE DE EDIÇÃO DE ITEM ---
const EditItemDialog = ({ open, onClose, item, onSave, tableId }: any) => {
    const [editedItem, setEditedItem] = useState<any>(item);

    useEffect(() => {
        if (item) {
            setEditedItem({ ...item, data: item.data || {} });
        }
    }, [item]);

    if (!editedItem) return null;

    const handleSave = () => {
        onSave(editedItem);
        onClose();
    };

    const updateData = (field: string, value: string) => {
        setEditedItem((prev: any) => ({
            ...prev,
            data: { ...prev.data, [field]: value }
        }));
    };

    const renderCategorySpecificFields = () => {
        const cat = editedItem.category;

        if (cat === 'weapon') {
            return (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Dano</Label>
                        <Input 
                            placeholder="Ex: 1d8"
                            value={editedItem.data?.damage || ""} 
                            onChange={(e) => updateData('damage', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Atributo</Label>
                        <Input 
                            placeholder="Ex: Vigoroso"
                            value={editedItem.data?.attackAttribute || ""} 
                            onChange={(e) => updateData('attackAttribute', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    {/* SELETOR DE QUALIDADES (ARMA) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Qualidade</Label>
                        <div className="col-span-3">
                            <QualitySelector 
                                tableId={tableId}
                                targetType="weapon"
                                value={editedItem.data?.quality || ""}
                                onChange={(val) => updateData('quality', val)}
                            />
                        </div>
                    </div>
                </>
            );
        }

        if (cat === 'armor') {
            return (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Proteção</Label>
                        <Input 
                            placeholder="Ex: 1d4"
                            value={editedItem.data?.protection || ""} 
                            onChange={(e) => updateData('protection', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Penalidade</Label>
                        <Input 
                            type="number"
                            placeholder="Ex: 2"
                            value={editedItem.data?.obstructive || ""} 
                            onChange={(e) => updateData('obstructive', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    {/* SELETOR DE QUALIDADES (ARMADURA) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Qualidade</Label>
                        <div className="col-span-3">
                            <QualitySelector 
                                tableId={tableId}
                                targetType="armor"
                                value={editedItem.data?.quality || ""}
                                onChange={(val) => updateData('quality', val)}
                            />
                        </div>
                    </div>
                </>
            );
        }

        if (cat === 'consumable') {
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs uppercase text-muted-foreground">Duração</Label>
                    <Input 
                        placeholder="Ex: 1 Cena"
                        value={editedItem.data?.duration || ""} 
                        onChange={(e) => updateData('duration', e.target.value)} 
                        className="col-span-3 h-8" 
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Item</DialogTitle>
                    <DialogDescription>Modifique os detalhes deste item.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Nome</Label>
                        <Input 
                            value={editedItem.name} 
                            onChange={(e) => setEditedItem({...editedItem, name: e.target.value})} 
                            className="col-span-3" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Categoria</Label>
                        <Select 
                            value={editedItem.category || "general"} 
                            onValueChange={(val) => setEditedItem({...editedItem, category: val})}
                        >
                            <SelectTrigger className="col-span-3 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {INVENTORY_CATEGORIES.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {renderCategorySpecificFields()}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Qtd.</Label>
                        <Input 
                            type="number" 
                            value={editedItem.quantity} 
                            onChange={(e) => setEditedItem({...editedItem, quantity: Number(e.target.value)})} 
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Peso</Label>
                        <Input 
                            type="number" 
                            value={editedItem.weight} 
                            onChange={(e) => setEditedItem({...editedItem, weight: Number(e.target.value)})} 
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Descrição</Label>
                        <Textarea 
                            value={editedItem.description || ""} 
                            onChange={(e) => setEditedItem({...editedItem, description: e.target.value})} 
                            className="col-span-3 min-h-[80px]" 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2"/> Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- GESTOR DE DINHEIRO ---
const MoneyManager = () => {
  const { form: { setValue, getValues } } = useCharacterSheet();
  const [amount, setAmount] = useState("1");
  const [currency, setCurrency] = useState<"taler" | "shekel" | "ortega">("ortega");

  const handleAdjustMoney = (operation: "add" | "spend") => {
    const val = parseInt(amount) || 0;
    if (val === 0) return;

    const currentMoney = getValues("money");
    const taler = Number(currentMoney.taler) || 0;
    const shekel = Number(currentMoney.shekel) || 0;
    const ortega = Number(currentMoney.ortega) || 0;

    let totalOrtegas = (taler * 100) + (shekel * 10) + ortega;
    let amountInOrtegas = currency === "taler" ? val * 100 : currency === "shekel" ? val * 10 : val;

    if (operation === "spend") totalOrtegas -= amountInOrtegas;
    else totalOrtegas += amountInOrtegas;

    if (totalOrtegas < 0) totalOrtegas = 0;

    setValue("money.taler", Math.floor(totalOrtegas / 100), { shouldDirty: true });
    setValue("money.shekel", Math.floor((totalOrtegas % 100) / 10), { shouldDirty: true });
    setValue("money.ortega", totalOrtegas % 10, { shouldDirty: true });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        <Input type="number" className="w-20 h-9" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
          <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="taler">Táler</SelectItem>
            <SelectItem value="shekel">Xelim</SelectItem>
            <SelectItem value="ortega">Ortega</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={() => handleAdjustMoney("add")}>Adicionar</Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => handleAdjustMoney("spend")}>Gastar</Button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DA ABA MOCHILA ---
export const BackpackTab = () => {
  const { form, character } = useCharacterSheet();
  const {
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
  } = useCharacterCalculations();
  const { toast } = useToast();

  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [itemToEquipIndex, setItemToEquipIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  if (!character) {
      return (
        <div className="space-y-4 p-1">
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
      );
  }

  const [taler, shekel, ortega] = form.watch(["money.taler", "money.shekel", "money.ortega"]);
  const totalOrtegas = (Number(taler)||0) * 100 + (Number(shekel)||0) * 10 + (Number(ortega)||0);
  
  const weightPercentage = Math.min(100, (currentWeight / (maxEncumbrance || 1)) * 100);
  const weightBarClass = currentWeight >= maxEncumbrance ? "bg-destructive" : (currentWeight > encumbranceThreshold ? "bg-amber-500" : "bg-primary");

  const inventory = (form.watch("inventory") || []) as any[];

  // --- ADICIONAR ITEM ---
  const handleAddItem = (itemTemplate: any) => {
    const newItem = {
        id: crypto.randomUUID(),
        name: itemTemplate ? itemTemplate.name : "Novo Item",
        category: itemTemplate ? itemTemplate.category : "general",
        weight: itemTemplate ? (Number(itemTemplate.weight) || 0) : 0,
        quantity: 1,
        data: itemTemplate ? (itemTemplate.data || {}) : {},
        description: itemTemplate ? itemTemplate.description : ""
    };

    const currentInv = form.getValues("inventory") || [];
    const newInventory = [...currentInv, newItem];
    
    form.setValue("inventory", newInventory, { shouldDirty: true });
    
    if (itemTemplate) {
        toast({ title: "Item Adicionado", description: `${newItem.name} na mochila.` });
    } else {
        // Abre o editor imediatamente para itens manuais
        setEditingItemIndex(newInventory.length - 1);
        toast({ title: "Item Criado", description: "Edite os detalhes agora." });
    }
  };

  // --- REMOVER ITEM ---
  const handleRemoveItem = (index: number) => {
    const currentInv = form.getValues("inventory");
    const newInv = currentInv.filter((_, i) => i !== index);
    form.setValue("inventory", newInv, { shouldDirty: true });
  };

  // --- SALVAR EDIÇÃO ---
  const handleSaveEdit = (updatedItem: any) => {
      if (editingItemIndex === null) return;
      const currentInv = [...inventory];
      currentInv[editingItemIndex] = updatedItem;
      
      form.setValue("inventory", currentInv, { shouldDirty: true });
      toast({ title: "Item Atualizado" });
      
      // Persistir no Supabase
      supabase.from("characters").update({
          data: { ...character.data, inventory: currentInv }
      }).eq("id", character.id).then();
  };

  // --- EQUIPAR ITEM ---
  const handleEquipClick = (index: number) => {
      const item = inventory[index];
      const category = item.category || item.data?.category;

      if (category === 'weapon') {
          performEquip(index, 'weapon');
      } else if (category === 'armor') {
          performEquip(index, 'armor');
      } else {
          setItemToEquipIndex(index);
          setEquipDialogOpen(true);
      }
  };

  const performEquip = (index: number, type: 'weapon' | 'armor') => {
      const item = inventory[index];
      const currentWeapons = form.getValues("weapons") || [];
      
      if (type === 'weapon' && currentWeapons.length >= 2) {
          toast({ title: "Limite Atingido", description: "Você já tem 2 armas equipadas.", variant: "destructive" });
          setEquipDialogOpen(false);
          return;
      }

      const currentQty = Number(item.quantity);
      if (currentQty > 1) {
          form.setValue(`inventory.${index}.quantity`, currentQty - 1, { shouldDirty: true });
      } else {
          const currentInv = form.getValues("inventory");
          const newInv = currentInv.filter((_, i) => i !== index);
          form.setValue("inventory", newInv, { shouldDirty: true });
      }

      if (type === 'weapon') {
          const newWeapon = {
              ...getDefaultWeapon(),
              name: item.name,
              damage: item.data?.damage || "",
              attribute: item.data?.attackAttribute || item.data?.attribute || "",
              quality: item.data?.quality || "",
              quality_desc: item.description || "",
              weight: Number(item.weight) || 1, 
          };
          form.setValue("weapons", [...currentWeapons, newWeapon], { shouldDirty: true });
          toast({ title: "Arma Equipada!", description: `${item.name} movida para Combate.` });
      } else {
          const currentArmors = form.getValues("armors") || [];
          const newArmor = {
              ...getDefaultArmor(),
              name: item.name,
              protection: item.data?.protection || "",
              obstructive: Number(item.data?.obstructive) || 0,
              quality: item.data?.quality || "",
              quality_desc: item.description || "",
              equipped: true,
              weight: Number(item.weight) || 0,
          };
          form.setValue("armors", [...currentArmors, newArmor], { shouldDirty: true });
          toast({ title: "Armadura Equipada!", description: `${item.name} movida para Combate.` });
      }
      
      setEquipDialogOpen(false);
  };

  const getCategoryLabel = (cat: string) => {
    const found = INVENTORY_CATEGORIES.find(c => c.id === cat);
    return found ? found.label : cat;
  };

  // IDs para o seletor principal (sem serviços, etc se quisermos filtrar mais no futuro)
  const selectorCategories = INVENTORY_CATEGORIES.map(c => c.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Coins className="w-4 h-4"/> Dinheiro</CardTitle>
            <CardDescription className="text-xs font-mono">Total: {totalOrtegas} Ortegas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <FormField control={form.control} name="money.taler" render={({ field }) => (
                    <FormItem className="space-y-1"><FormLabel className="text-xs text-blue-400 flex items-center"><Gem className="w-3 h-3 mr-1"/> Táler</FormLabel><FormControl><Input className="h-8" type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
                )}/>
                <FormField control={form.control} name="money.shekel" render={({ field }) => (
                    <FormItem className="space-y-1"><FormLabel className="text-xs text-gray-400 flex items-center"><Gem className="w-3 h-3 mr-1"/> Xelim</FormLabel><FormControl><Input className="h-8" type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
                )}/>
                <FormField control={form.control} name="money.ortega" render={({ field }) => (
                    <FormItem className="space-y-1"><FormLabel className="text-xs text-yellow-600 flex items-center"><Gem className="w-3 h-3 mr-1"/> Ortega</FormLabel><FormControl><Input className="h-8" type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
                )}/>
            </div>
            <Separator />
            <MoneyManager />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4"/> Experiência</CardTitle>
            <CardDescription className="text-xs">XP Disponível: <span className="text-accent font-bold">{currentExperience}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="experience.total" render={({ field }) => (
                    <FormItem><FormLabel>Total Ganho</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
                )}/>
                <FormField control={form.control} name="experience.spent" render={({ field }) => (
                    <FormItem><FormLabel>Total Gasto</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value)}/></FormControl></FormItem>
                )}/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Weight className="w-4 h-4"/> Carga</CardTitle>
            <CardDescription className="text-xs">Penalidade: <span className={encumbrancePenalty > 0 ? "text-destructive font-bold" : ""}>-{encumbrancePenalty}</span> na Defesa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
               <div className="flex justify-between text-sm">
                  <span>Peso: <strong>{currentWeight}</strong></span>
                  <span className="text-muted-foreground">Máx: {maxEncumbrance}</span>
               </div>
               <Progress value={weightPercentage} className="h-2" indicatorClassName={weightBarClass} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
                <div>Limiar: {encumbranceThreshold}</div>
                <div className="text-right">Imóvel: {maxEncumbrance}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <SharedProjectileList 
            control={form.control} 
            name="projectiles" 
            tableId={character.table_id} 
        />
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Backpack className="w-5 h-5" /> 
                    Mochila & Equipamento
                </CardTitle>
                <ItemSelectorDialog 
                    tableId={character.table_id} 
                    categories={selectorCategories} 
                    title="Adicionar à Mochila"
                    onSelect={handleAddItem}
                >
                    <Button size="sm" variant="outline" className="border-dashed">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                    </Button>
                </ItemSelectorDialog>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-4">
                    <div className="space-y-2 pb-4">
                        {inventory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md m-2">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Mochila vazia.</p>
                            </div>
                        ) : (
                            inventory.map((item: any, index: number) => (
                                <div key={item.id || index} className="flex items-center justify-between p-3 bg-card border rounded-md hover:border-primary/40 transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-muted w-9 h-9 rounded-md flex items-center justify-center shrink-0">
                                            <Package className="w-4 h-4 opacity-50" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium flex items-center gap-2 truncate text-sm">
                                                {item.name}
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1 font-normal">
                                                    x{item.quantity}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate capitalize">
                                                {getCategoryLabel(item.category || item.data?.category)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground mr-2">
                                            {item.weight} peso
                                        </Badge>
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            title="Editar Detalhes"
                                            onClick={() => setEditingItemIndex(index)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        {(item.category === 'weapon' || item.category === 'armor' || item.data?.category === 'weapon' || item.data?.category === 'armor') && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                title="Equipar (Mover para Combate)"
                                                onClick={() => handleEquipClick(index)}
                                            >
                                                {item.category === 'weapon' || item.data?.category === 'weapon' ? <Sword className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>

      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Equipar Item</DialogTitle>
                  <DialogDescription>Como deseja equipar este item?</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => itemToEquipIndex !== null && performEquip(itemToEquipIndex, 'armor')}>Como Armadura</Button>
                  <Button onClick={() => itemToEquipIndex !== null && performEquip(itemToEquipIndex, 'weapon')}>Como Arma</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* DIALOG DE EDIÇÃO (Passando tableId para o QualitySelector) */}
      {editingItemIndex !== null && (
          <EditItemDialog 
              open={editingItemIndex !== null} 
              onClose={() => setEditingItemIndex(null)} 
              item={inventory[editingItemIndex]} 
              tableId={character.table_id}
              onSave={handleSaveEdit}
          />
      )}

    </div>
  );
};