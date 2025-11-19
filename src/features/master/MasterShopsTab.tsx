// src/features/master/MasterShopsTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Trash2, PackagePlus, Send, Gem, Coins } from "lucide-react";
import { formatPrice } from "@/lib/economy-utils"; // Importação atualizada
import { Separator } from "@/components/ui/separator";

// Queries (Mantidas)
const fetchShops = async (tableId: string) => {
  const { data, error } = await supabase.from("shops").select("*").eq("table_id", tableId).order("created_at");
  if (error) throw error;
  return data as Shop[];
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
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const { data: shops = [] } = useQuery({
    queryKey: ['shops', tableId],
    queryFn: () => fetchShops(tableId),
  });

  const handleCreateShop = async () => {
    if (!newShopName.trim()) return;
    const { error } = await supabase.from("shops").insert({ table_id: tableId, name: newShopName });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Loja Criada!" });
      setNewShopName("");
      queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
    }
  };

  const handleDeleteShop = async (id: string) => {
    await supabase.from("shops").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
    if (selectedShop?.id === id) setSelectedShop(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-lg border">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="shop-name">Nova Loja / Local de Comércio</Label>
          <Input 
            id="shop-name" 
            placeholder="Ex: Ferreiro do Porto, Taverna Velha..." 
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
                className={`p-3 rounded-md border cursor-pointer transition-colors flex justify-between items-center ${selectedShop?.id === shop.id ? "bg-accent/20 border-accent" : "hover:bg-muted"}`}
                onClick={() => setSelectedShop(shop)}
              >
                <span className="font-medium">{shop.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
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
  
  // Estado local do formulário
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

    // Calcular preço final em Ortegas
    let multiplier = 1;
    if (currencyType === "shekel") multiplier = 10;
    if (currencyType === "taler") multiplier = 100;
    
    const finalPrice = (parseInt(newItem.amount as any) || 0) * multiplier;

    const { error } = await supabase.from("shop_items").insert({
      shop_id: shop.id,
      name: newItem.name,
      price: finalPrice, // Guarda sempre em Ortegas
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
        
        {/* Formulário de Adicionar Item Melhorado */}
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
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
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

        {/* Lista de Itens */}
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
                         {/* Aqui usamos o formatPrice para mostrar bonitinho */}
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