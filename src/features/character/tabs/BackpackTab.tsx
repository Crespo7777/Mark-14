// src/features/character/tabs/BackpackTab.tsx

import { useState } from "react";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Gem, TrendingUp, Weight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SharedInventoryList } from "@/components/SharedInventoryList";
import { SharedProjectileList } from "@/components/SharedProjectileList";
import { useToast } from "@/hooks/use-toast";
import { 
  getDefaultWeapon, 
  getDefaultArmor, 
  InventoryItem 
} from "../character.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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

export const BackpackTab = () => {
  const { form } = useCharacterSheet();
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

  const [taler, shekel, ortega] = form.watch(["money.taler", "money.shekel", "money.ortega"]);
  const totalOrtegas = (Number(taler)||0) * 100 + (Number(shekel)||0) * 10 + (Number(ortega)||0);
  
  const weightPercentage = Math.min(100, (currentWeight / (maxEncumbrance || 1)) * 100);
  const weightBarClass = currentWeight >= maxEncumbrance ? "bg-destructive" : (currentWeight > encumbranceThreshold ? "bg-amber-500" : "bg-primary");

  const handleEquipClick = (index: number) => {
      const item = form.getValues(`inventory.${index}`);
      const category = item.data?.category;

      // Se soubermos o que é, equipamos direto
      if (category === 'weapon') {
          performEquip(index, 'weapon');
      } else if (category === 'armor') {
          performEquip(index, 'armor');
      } else {
          // Se não soubermos, perguntamos ao utilizador
          setItemToEquipIndex(index);
          setEquipDialogOpen(true);
      }
  };

  const performEquip = (index: number, type: 'weapon' | 'armor') => {
      const item = form.getValues(`inventory.${index}`);
      const currentWeapons = form.getValues("weapons") || [];
      
      // Limite de armas
      if (type === 'weapon' && currentWeapons.length >= 2) {
          toast({ 
              title: "Limite Atingido", 
              description: "Você já tem 2 armas equipadas. Desequipe uma primeiro.", 
              variant: "destructive" 
          });
          setEquipDialogOpen(false);
          return;
      }

      // Reduzir quantidade ou remover da mochila
      const currentQty = Number(item.quantity);
      if (currentQty > 1) {
          form.setValue(`inventory.${index}.quantity`, currentQty - 1, { shouldDirty: true });
      } else {
          // Remove o item da lista
          const currentInv = form.getValues("inventory");
          const newInv = currentInv.filter((_, i) => i !== index);
          form.setValue("inventory", newInv, { shouldDirty: true });
      }

      // Adicionar à lista correta
      if (type === 'weapon') {
          const newWeapon = {
              ...getDefaultWeapon(),
              name: item.name,
              // Tenta recuperar dados, senão usa defaults
              damage: item.data?.damage || "",
              attribute: item.data?.attribute || "",
              attackAttribute: item.data?.attackAttribute || "",
              quality: item.data?.quality || "",
              quality_desc: item.description || "", // A descrição original vai para as notas da qualidade
          };
          const newWeapons = [...currentWeapons, newWeapon];
          form.setValue("weapons", newWeapons, { shouldDirty: true });
          toast({ title: "Arma Equipada!", description: `${item.name} movida para Combate.` });
      } else {
          const currentArmors = form.getValues("armors") || [];
          const newArmor = {
              ...getDefaultArmor(),
              name: item.name,
              protection: item.data?.protection || "",
              obstructive: Number(item.weight) || 0, // Armadura usa peso como estorvo muitas vezes
              quality: item.data?.quality || "",
              quality_desc: item.description || "",
              equipped: true
          };
          const newArmors = [...currentArmors, newArmor];
          form.setValue("armors", newArmors, { shouldDirty: true });
          toast({ title: "Armadura Equipada!", description: `${item.name} movida para Combate.` });
      }
      
      setEquipDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Dinheiro */}
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

        {/* Card Experiência */}
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

        {/* Card Carga */}
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
        <SharedProjectileList control={form.control} name="projectiles" />
        
        {/* Passamos a função de equipar aqui */}
        <SharedInventoryList 
            control={form.control} 
            name="inventory" 
            title="Mochila & Equipamento" 
            onEquipItem={handleEquipClick}
        />
      </div>

      {/* DIALOGO PARA ESCOLHER O TIPO DE EQUIPAMENTO (Se não tiver categoria definida) */}
      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Equipar Item</DialogTitle>
                  <DialogDescription>Como deseja equipar este item?</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => performEquip(itemToEquipIndex!, 'armor')}>Como Armadura</Button>
                  <Button onClick={() => performEquip(itemToEquipIndex!, 'weapon')}>Como Arma</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
};