// src/features/master/MasterShopsTab.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Importar Switch
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Trash2, PackagePlus, Send, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { formatPrice } from "@/lib/economy-utils";
import { Separator } from "@/components/ui/separator";

// Adicionamos is_open à interface no fetch (via SQL select *)
const fetchShops = async (tableId: string) => {
  const { data, error } = await supabase.from("shops").select("*").eq("table_id", tableId).order("created_at");
  if (error) throw error;
  return data as (Shop & { is_open: boolean })[];
};

const fetchShopItems = async (shopId: string) => {
  const { data, error } = await supabase.from("shop_items").select("*").eq("shop_id", shopId).order("name");
  if (error) throw error;
  return data as ShopItem[];
};

const fetchCharacters = async (tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("table_id", tableId);
  return (data || []) as CharacterWithRelations[];
};

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

  // Sincronizar estado global da aba
  useEffect(() => {
    supabase.from("tables").select("shops_open").eq("id", tableId).single()
      .then(({ data }) => { if(data) setGlobalShopsOpen(!!data.shops_open) });
  }, [tableId]);

  const handleToggleGlobalShop = async (checked: boolean) => {
    setGlobalShopsOpen(checked);
    const { error } = await supabase.from("tables").update({ shops_open: checked }).eq("id", tableId);
    if (error) {
        setGlobalShopsOpen(!checked); // Revert on error
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
        is_open: false // Começa fechada por padrão
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
    
    // Optimistic update local
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
      
      {/* Controlo Global */}
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
                <Switch 
                    id="global-shop-toggle"
                    checked={globalShopsOpen} 
                    onCheckedChange={handleToggleGlobalShop} 
                />
            </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-lg border">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="shop-name">Nova Loja / Local</Label>
          <Input 
            id="shop-name" 
            placeholder="Ex: Ferreiro do Porto..." 
            value={newShopName}
            onChange={e => setNewShopName(e.target.value)}
          />
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
                    <Button 
                        variant="ghost" size="icon" className="h-6 w-6"
                        title={shop.is_open ? "Ocultar" : "Mostrar"}
                        onClick={(e) => handleToggleShopVisibility(shop, e)}
                    >
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

// O componente ShopItemsManager mantém-se igual, não precisa de alterações
const ShopItemsManager = ({ shop, tableId }: { shop: Shop, tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newItem, setNewItem] = useState({ name: "", amount: 0, weight: 0, description: "" });
  const [currencyType, setCurrencyType] = useState<"ortega" | "shekel" | "taler">("ortega");
  const [itemToSend, setItemToSend] = useState<ShopItem | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['shop_items', shop.id],
    queryFn: () => fetchShopItems(shop.id),
  });

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: () => fetchCharacters(tableId),
  });

  const handleAddItem = async () => {
    if (!newItem.name) {
        toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" });
        return;
    }

    let multiplier = 1;
    if (currencyType === "shekel") multiplier = 10;
    if (currencyType === "taler") multiplier = 100;
    const finalPrice = (parseInt(newItem.amount as any) || 0) * multiplier;

    const { error } = await supabase.from("shop_items").insert({
      shop_id: shop.id,
      name: newItem.name,
      price: finalPrice, 
      weight: newItem.weight,
      description: newItem.description
    });

    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      setNewItem({ name: "", amount: 0, weight: 0, description: "" }); 
      setCurrencyType("ortega");
      queryClient.invalidateQueries({ queryKey: ['shop_items', shop.id] });
    }
  };

  const handleDeleteItem = async (id: string) => {
    await supabase.from("shop_items").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['shop_items', shop.id] });
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
      description: itemToSend.description || "Presente do Mestre"
    };

    const currentInventory = (char.data as any).inventory || [];
    const newInventory = [...currentInventory, newItemObj];
    const newData = { ...(char.data as any), inventory: newInventory };

    const { error } = await supabase.from("characters").update({ data: newData }).eq("id", charId);

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shop.name}</CardTitle>
        <CardDescription>Adicione itens que estarão à venda aqui.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/20 p-4 rounded-md space-y-4">
            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                    <Label className="text-xs">Nome do Item</Label>
                    <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ex: Poção de Cura" />
                </div>
                <div className="col-span-2">
                    <Label className="text-xs">Peso</Label>
                    <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)||0})} />
                </div>
                <div className="col-span-4">
                    <Label className="text-xs">Descrição (Opcional)</Label>
                     <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="..." />
                </div>
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
                <div className="col-span-5">
                    <Button onClick={handleAddItem} className="w-full"><Plus className="w-4 h-4 mr-2" /> Adicionar à Loja</Button>
                </div>
            </div>
        </div>

        <Separator />

        <div className="space-y-2">
           {items.length === 0 && <p className="text-muted-foreground text-center py-4">Sem estoque.</p>}
           {items.map(item => (
             <div key={item.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/10 text-sm">
                <div className="flex-1">
                   <div className="font-bold">{item.name}</div>
                   <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                   <div>
                      <div className="font-bold text-accent flex items-center justify-end gap-1">
                         {formatPrice(item.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.weight} peso</div>
                   </div>
                   
                   <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setItemToSend(item)}>
                           <Send className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Enviar {item.name}</DialogTitle>
                           <DialogDescription>O jogador receberá este item gratuitamente.</DialogDescription>
                         </DialogHeader>
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