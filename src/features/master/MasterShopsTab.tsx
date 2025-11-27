// src/features/master/MasterShopsTab.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations, ItemTemplate } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; 
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Trash2, PackagePlus, Send, Lock, Unlock, Eye, EyeOff, Database, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/economy-utils";
import { Separator } from "@/components/ui/separator";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";

// Interface estendida para incluir 'data'
interface ExtendedShopItem extends ShopItem {
  data?: any;
}

const SHOP_CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'weapon', label: 'Arma' },
  { value: 'armor', label: 'Armadura' },
  { value: 'consumable', label: 'Consumível' },
  { value: 'mystic', label: 'Místico' },
  { value: 'tool', label: 'Ferramenta' },
];

const fetchShops = async (tableId: string) => {
  const { data, error } = await supabase.from("shops").select("*").eq("table_id", tableId).order("created_at");
  if (error) throw error;
  return data as (Shop & { is_open: boolean })[];
};

const fetchShopItems = async (shopId: string) => {
  const { data, error } = await supabase.from("shop_items").select("*").eq("shop_id", shopId).order("name");
  if (error) throw error;
  return data as ExtendedShopItem[];
};

const fetchCharacters = async (tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("table_id", tableId);
  return (data || []) as CharacterWithRelations[];
};

// --- COMPONENTE PRINCIPAL EXPORTADO ---
export const MasterShopsTab = ({ tableId }: { tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newShopName, setNewShopName] = useState("");
  const [selectedShop, setSelectedShop] = useState<(Shop & { is_open: boolean }) | null>(null);
  const [globalShopsOpen, setGlobalShopsOpen] = useState(false);

  const { data: shops = [] } = useQuery({
    queryKey: ['shops', tableId],
    queryFn: () => fetchShops(tableId),
  });

  useEffect(() => {
    supabase.from("tables").select("shops_open").eq("id", tableId).single()
      .then(({ data }) => { if(data) setGlobalShopsOpen(!!data.shops_open) });
  }, [tableId]);

  const handleToggleGlobalShop = async (checked: boolean) => {
    setGlobalShopsOpen(checked);
    const { error } = await supabase.from("tables").update({ shops_open: checked }).eq("id", tableId);
    if (error) {
        setGlobalShopsOpen(!checked); 
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
        toast({ 
            title: checked ? "Mercado Aberto" : "Mercado Fechado", 
            description: checked ? "Jogadores agora veem a aba 'Mercado'." : "Aba removida dos jogadores." 
        });
    }
  };

  const handleCreateShop = async () => {
    if (!newShopName.trim()) return;
    const { error } = await supabase.from("shops").insert({ 
        table_id: tableId, 
        name: newShopName,
        is_open: false 
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Loja Criada!", description: "Inicialmente oculta para jogadores." });
      setNewShopName("");
      queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
    }
  };

  const handleDeleteShop = async (id: string) => {
    await supabase.from("shops").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
    if (selectedShop?.id === id) setSelectedShop(null);
  };

  const handleToggleShopVisibility = async (shop: Shop & { is_open: boolean }, e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !shop.is_open;
    // Atualiza localmente para feedback imediato na lista
    if (selectedShop?.id === shop.id) setSelectedShop({...shop, is_open: newState});

    const { error } = await supabase.from("shops").update({ is_open: newState }).eq("id", shop.id);
    
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
        toast({ title: newState ? "Loja Visível" : "Loja Oculta" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/20 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${globalShopsOpen ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                    <Store className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold">Aba de Mercado</h3>
                    <p className="text-xs text-muted-foreground">
                        {globalShopsOpen ? "Visível para os jogadores" : "Oculta para os jogadores"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="global-shop-toggle" className="text-xs font-normal text-muted-foreground">
                    {globalShopsOpen ? "Aberto" : "Fechado"}
                </Label>
                <Switch id="global-shop-toggle" checked={globalShopsOpen} onCheckedChange={handleToggleGlobalShop} />
            </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-lg border">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="shop-name">Nova Loja / Local</Label>
          <Input id="shop-name" placeholder="Ex: Ferreiro do Porto..." value={newShopName} onChange={e => setNewShopName(e.target.value)} />
        </div>
        <Button onClick={handleCreateShop}><Plus className="w-4 h-4 mr-2" /> Criar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Store className="w-4 h-4"/> Locais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shops.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma loja criada.</p>}
            {shops.map(shop => (
              <div 
                key={shop.id} 
                className={`p-3 rounded-md border cursor-pointer transition-all flex justify-between items-center ${selectedShop?.id === shop.id ? "bg-accent/20 border-accent" : "hover:bg-muted"}`}
                onClick={() => setSelectedShop(shop)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                    {shop.is_open ? <Eye className="w-3 h-3 text-green-500 shrink-0" /> : <EyeOff className="w-3 h-3 text-muted-foreground shrink-0" />}
                    <span className={`font-medium truncate ${!shop.is_open && "text-muted-foreground"}`}>{shop.name}</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title={shop.is_open ? "Ocultar" : "Mostrar"} onClick={(e) => handleToggleShopVisibility(shop, e)}>
                        {shop.is_open ? <Unlock className="w-3 h-3 text-primary"/> : <Lock className="w-3 h-3 text-muted-foreground"/>}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {selectedShop ? (
            <ShopItemsManager shop={selectedShop} tableId={tableId} />
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg bg-muted/10 p-8 text-muted-foreground">
              Selecione uma loja para gerenciar o estoque.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShopItemsManager = ({ shop, tableId }: { shop: Shop, tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newItem, setNewItem] = useState({ name: "", amount: 0, weight: 0, description: "", category: "general", data: {} as any });
  const [currencyType, setCurrencyType] = useState<"ortega" | "shekel" | "taler">("ortega");
  const [itemToSend, setItemToSend] = useState<ExtendedShopItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const queryKey = ['shop_items', shop.id];

  const { data: items = [] } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchShopItems(shop.id),
  });

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
  });

  useEffect(() => {
      setNewItem(prev => ({ ...prev, data: {} }));
  }, [newItem.category]);

  const handleAddItem = async () => {
    if (!newItem.name) {
        toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" });
        return;
    }
    setIsAdding(true);

    let multiplier = 1;
    if (currencyType === "shekel") multiplier = 10;
    if (currencyType === "taler") multiplier = 100;
    const finalPrice = (parseInt(newItem.amount as any) || 0) * multiplier;

    const payload = {
      shop_id: shop.id,
      name: newItem.name,
      price: finalPrice, 
      weight: newItem.weight,
      description: newItem.description,
      data: { category: newItem.category, ...newItem.data }
    };

    try {
        const { data, error } = await supabase.from("shop_items").insert(payload).select().single();
        
        if (error) throw error;

        // OTIMIZAÇÃO: Atualiza o cache instantaneamente
        queryClient.setQueryData(queryKey, (old: ExtendedShopItem[] | undefined) => {
            return old ? [...old, data].sort((a,b) => a.name.localeCompare(b.name)) : [data];
        });

        setNewItem({ name: "", amount: 0, weight: 0, description: "", category: "general", data: {} }); 
        setCurrencyType("ortega");

    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setIsAdding(false);
    }
  };

  const handleImportFromDatabase = async (template: ItemTemplate | null) => {
     if (!template) return;
     setIsAdding(true);

     let price = 0;
     const templatePriceStr = template.data?.price ? String(template.data.price).toLowerCase() : "";
     const numMatch = templatePriceStr.match(/\d+/);
     if (numMatch) {
        const val = parseInt(numMatch[0]);
        if (templatePriceStr.includes("táler") || templatePriceStr.includes("taler")) price = val * 100;
        else if (templatePriceStr.includes("xelim") || templatePriceStr.includes("shekel")) price = val * 10;
        else price = val;
     }

     try {
         const { data, error } = await supabase.from("shop_items").insert({
            shop_id: shop.id,
            name: template.name,
            description: template.description,
            weight: template.weight,
            price: price,
            data: { ...template.data, category: template.category }
         }).select().single();

         if (error) throw error;

         // OTIMIZAÇÃO
         queryClient.setQueryData(queryKey, (old: ExtendedShopItem[] | undefined) => {
             return old ? [...old, data].sort((a,b) => a.name.localeCompare(b.name)) : [data];
         });

         toast({ title: "Item Importado!" });
     } catch (error: any) {
         toast({ title: "Erro ao importar", description: error.message, variant: "destructive" });
     } finally {
         setIsAdding(false);
     }
  };

  const handleDeleteItem = async (id: string) => {
    // Optimistic Delete
    const previousData = queryClient.getQueryData<ExtendedShopItem[]>(queryKey);
    queryClient.setQueryData(queryKey, (old: ExtendedShopItem[] | undefined) => {
        return old ? old.filter(i => i.id !== id) : [];
    });

    const { error } = await supabase.from("shop_items").delete().eq("id", id);
    
    if (error) {
        queryClient.setQueryData(queryKey, previousData);
        toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  };

  const handleSendLoot = async (charId: string) => {
    if (!itemToSend) return;
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const newItemObj = {
      id: crypto.randomUUID(),
      name: itemToSend.name,
      quantity: 1,
      weight: itemToSend.weight,
      description: itemToSend.description || "Presente do Mestre",
      data: itemToSend.data || {}
    };

    const currentInventory = (char.data as any).inventory || [];
    const newInventory = [...currentInventory, newItemObj];
    const newData = { ...(char.data as any), inventory: newInventory };

    const { error } = await supabase.from("characters").update({ data: newData }).eq("id", charId);

    if (error) toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Item Enviado!", description: `${itemToSend.name} enviado para ${char.name}.` });
      await supabase.from("chat_messages").insert({
        table_id: tableId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        message: `🎁 **${char.name}** recebeu **${itemToSend.name}**!`,
        message_type: "info"
      });
      setItemToSend(null);
    }
  };

  const updateData = (key: string, value: string) => {
    setNewItem(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const renderSpecificFields = () => {
    switch (newItem.category) {
      case 'weapon':
        return (
           <div className="grid grid-cols-2 gap-2 mt-2 bg-background/50 p-2 rounded border">
               <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="h-8 text-xs"/>
               <Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => updateData('attackAttribute', e.target.value)} className="h-8 text-xs"/>
               <Input placeholder="Qualidades" className="col-span-2 h-8 text-xs" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} />
           </div>
        );
      case 'armor':
        return (
           <div className="grid grid-cols-2 gap-2 mt-2 bg-background/50 p-2 rounded border">
               <Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="h-8 text-xs"/>
               <Input placeholder="Obstrutiva (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="h-8 text-xs"/>
               <Input placeholder="Qualidades" className="col-span-2 h-8 text-xs" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} />
           </div>
        );
      case 'consumable':
        return (
           <div className="grid grid-cols-2 gap-2 mt-2 bg-background/50 p-2 rounded border">
               <Input placeholder="Efeito Principal" className="col-span-2 h-8 text-xs" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} />
               <Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="h-8 text-xs"/>
               <Input placeholder="Uso (Beber...)" value={newItem.data.usage || ""} onChange={e => updateData('usage', e.target.value)} className="h-8 text-xs"/>
           </div>
        );
      case 'mystic':
         return (
            <div className="grid grid-cols-2 gap-2 mt-2 bg-background/50 p-2 rounded border">
                <Input placeholder="Poder" value={newItem.data.powerLevel || ""} onChange={e => updateData('powerLevel', e.target.value)} className="h-8 text-xs"/>
                <Input placeholder="Corrupção" value={newItem.data.corruption || ""} onChange={e => updateData('corruption', e.target.value)} className="h-8 text-xs"/>
                <Input placeholder="Efeito" className="col-span-2 h-8 text-xs" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} />
            </div>
         );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shop.name}</CardTitle>
        <CardDescription>Adicione itens que estarão à venda aqui.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/20 p-4 rounded-md space-y-4 border border-dashed border-border">
            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                    <Label className="text-xs">Nome do Item</Label>
                    <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ex: Adaga Curta" />
                </div>
                <div className="col-span-4">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SHOP_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">Peso</Label>
                    <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)||0})} />
                </div>
            </div>
            {renderSpecificFields()}
            <div className="w-full">
                <Label className="text-xs">Descrição (Opcional)</Label>
                <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="..." />
            </div>
            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                    <Label className="text-xs">Valor</Label>
                    <Input type="number" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: parseInt(e.target.value)||0})} />
                </div>
                <div className="col-span-4">
                    <Label className="text-xs">Moeda</Label>
                    <Select value={currencyType} onValueChange={(v: any) => setCurrencyType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="taler">Táler (Ouro)</SelectItem>
                            <SelectItem value="shekel">Xelim (Prata)</SelectItem>
                            <SelectItem value="ortega">Ortega (Cobre)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-5 flex gap-1">
                    <Button onClick={handleAddItem} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isAdding}>
                        {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />} 
                        Adicionar
                    </Button>
                    <ItemSelectorDialog 
                        tableId={tableId} 
                        categories={['weapon', 'armor', 'consumable', 'general', 'material', 'mystic', 'service', 'mount']} 
                        onSelect={handleImportFromDatabase}
                        title="Importar"
                    >
                         <Button variant="outline" size="icon" title="Importar do Database" disabled={isAdding}>
                            <Database className="w-4 h-4" />
                         </Button>
                    </ItemSelectorDialog>
                </div>
            </div>
        </div>
        <Separator />
        <div className="space-y-2">
           {items.length === 0 && <p className="text-muted-foreground text-center py-4">Sem estoque.</p>}
           {items.map(item => (
             <div key={item.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/10 text-sm">
                <div className="flex-1">
                   <div className="font-bold flex items-center gap-2">
                        {item.name}
                        {item.data?.category && <span className="text-[9px] uppercase border px-1 rounded bg-background text-muted-foreground">{item.data.category === 'general' ? 'Geral' : item.data.category}</span>}
                        {item.data?.damage && <span className="text-[9px] border px-1 rounded bg-background text-muted-foreground">Dano: {item.data.damage}</span>}
                        {item.data?.protection && <span className="text-[9px] border px-1 rounded bg-background text-muted-foreground">Prot: {item.data.protection}</span>}
                   </div>
                   <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                   <div>
                      <div className="font-bold text-accent flex items-center justify-end gap-1">{formatPrice(item.price)}</div>
                      <div className="text-xs text-muted-foreground">{item.weight} peso</div>
                   </div>
                   <Dialog>
                      <DialogTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setItemToSend(item)}><Send className="w-3 h-3" /></Button></DialogTrigger>
                      <DialogContent>
                         <DialogHeader><DialogTitle>Enviar {item.name}</DialogTitle><DialogDescription>O jogador receberá este item gratuitamente.</DialogDescription></DialogHeader>
                         <div className="grid gap-2 py-4">
                            {characters.map(char => (
                               <Button key={char.id} variant="ghost" className="justify-start" onClick={() => handleSendLoot(char.id)}>
                                  <PackagePlus className="w-4 h-4 mr-2 text-primary" />
                                  {char.name}
                               </Button>
                            ))}
                         </div>
                      </DialogContent>
                   </Dialog>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="w-3 h-3" />
                   </Button>
                </div>
             </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
};