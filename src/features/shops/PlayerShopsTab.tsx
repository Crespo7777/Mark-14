// src/features/shops/PlayerShopsTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Coins, Weight, Infinity as InfinityIcon } from "lucide-react";
import { convertFromOrtegas, convertToOrtegas, formatPrice } from "@/lib/economy-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtendedShopItem extends ShopItem {
  data?: any;
}

const fetchShops = async (tableId: string) => {
  const { data } = await supabase.from("shops").select("*").eq("table_id", tableId);
  return data as Shop[];
};

const fetchShopItems = async (shopId: string) => {
  const { data } = await supabase.from("shop_items").select("*").eq("shop_id", shopId);
  return data as ExtendedShopItem[];
};

const fetchMyCharacter = async (userId: string, tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("player_id", userId).eq("table_id", tableId).maybeSingle();
  return data as CharacterWithRelations | null;
};

export const PlayerShopsTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const { data: shops = [] } = useQuery({ queryKey: ['shops', tableId], queryFn: () => fetchShops(tableId) });
  const { data: items = [] } = useQuery({ 
    queryKey: ['shop_items', selectedShopId], 
    queryFn: () => fetchShopItems(selectedShopId!), 
    enabled: !!selectedShopId 
  });
  const { data: character } = useQuery({ queryKey: ['my_character_money', tableId, userId], queryFn: () => fetchMyCharacter(userId, tableId) });

  const currentMoney = character ? (character.data as any).money : { taler:0, shekel:0, ortega:0 };
  const totalPlayerOrtegas = convertToOrtegas(currentMoney);

  const handleBuy = async (item: ExtendedShopItem) => {
    if (!character) return;
    
    const price = parseInt(item.price as any) || 0;
    const playerMoney = parseInt(totalPlayerOrtegas as any) || 0;
    const isInfinite = item.quantity === -1;

    if (playerMoney < price) {
      toast({ title: "Saldo Insuficiente", variant: "destructive" });
      return;
    }

    // VERIFICAÇÃO DE ESTOQUE
    if (!isInfinite && item.quantity <= 0) {
        toast({ title: "Esgotado!", description: "Este item não está mais disponível.", variant: "destructive" });
        return;
    }
    
    setBuyingId(item.id);

    // --- LÓGICA DE COMPRA ---
    const newTotalOrtegas = playerMoney - price;
    const newMoney = convertFromOrtegas(newTotalOrtegas);
    const currentInventory = (character.data as any).inventory || [];
    const isService = item.data?.category === 'service';
    
    let newInventory = currentInventory;

    if (!isService) {
        const newItemObj = {
            id: crypto.randomUUID(),
            name: item.name,
            quantity: 1,
            weight: item.weight,
            description: item.description,
            data: item.data || {} 
        };
        newInventory = [...currentInventory, newItemObj];
    }
    
    const newData = { 
      ...(character.data as any), 
      money: newMoney, 
      inventory: newInventory 
    };

    // Optimistic Update da Ficha
    const queryKeyChar = ['my_character_money', tableId, userId];
    const previousCharacter = queryClient.getQueryData(queryKeyChar);
    queryClient.setQueryData(queryKeyChar, (old: any) => { if (!old) return old; return { ...old, data: newData }; });

    // Optimistic Update do Estoque (Visual)
    if (!isInfinite) {
        queryClient.setQueryData(['shop_items', selectedShopId], (old: ExtendedShopItem[] | undefined) => {
            return old ? old.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i) : [];
        });
    }

    const successMessage = isService 
        ? `Serviço "${item.name}" adquirido.`
        : `-${formatPrice(price)}. ${item.name} adicionado.`;

    toast({ title: "Compra realizada!", description: successMessage });

    // Transação Real (Update Personagem + Update Loja se necessário)
    try {
        await supabase.from("characters").update({ data: newData }).eq("id", character.id);

        if (!isInfinite) {
            await supabase.rpc('decrement_shop_item_quantity', { row_id: item.id });
            // Fallback manual se RPC não existir (embora RPC seja mais seguro para concorrência)
            // await supabase.from("shop_items").update({ quantity: item.quantity - 1 }).eq("id", item.id);
        }

        // Log no Chat
        await supabase.from("chat_messages").insert({
            table_id: tableId,
            user_id: userId,
            message: `💰 **${character.name}** ${isService ? "pagou por" : "comprou"} **${item.name}** por ${formatPrice(price)}.${isService ? " (Serviço)" : ""}`,
            message_type: "info"
        });
        
        queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });
        // Revalida o estoque real para garantir consistência
        if (!isInfinite) queryClient.invalidateQueries({ queryKey: ['shop_items', selectedShopId] });

    } catch (err) {
        console.error(err);
        toast({ title: "Erro na compra", variant: "destructive" });
        queryClient.setQueryData(queryKeyChar, previousCharacter); // Rollback
        queryClient.invalidateQueries({ queryKey: ['shop_items', selectedShopId] }); // Rollback estoque
    }
    
    setBuyingId(null);
  };

  if (!character) return <div className="p-8 text-center text-muted-foreground">Você precisa de uma ficha de personagem para comprar.</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="text-primary"/> Mercado</h3>
            <p className="text-xs text-muted-foreground">Selecione uma loja para ver os itens.</p>
        </div>
        <div className="text-right">
            <div className="text-sm font-mono text-accent font-bold flex items-center justify-end gap-1">
                {formatPrice(totalPlayerOrtegas)}
            </div>
            <span className="text-[10px] text-muted-foreground">Seu Saldo</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {shops.map(shop => (
           <Button 
              key={shop.id} 
              variant={selectedShopId === shop.id ? "default" : "outline"}
              onClick={() => setSelectedShopId(shop.id)}
              className="whitespace-nowrap"
           >
              {shop.name}
           </Button>
        ))}
        {shops.length === 0 && <p className="text-sm text-muted-foreground px-4">Nenhuma loja disponível.</p>}
      </div>

      <Card className="flex-1">
         <CardContent className="p-0 h-[500px]">
            <ScrollArea className="h-full p-4">
                {!selectedShopId && <div className="text-center py-20 text-muted-foreground">Selecione uma loja acima.</div>}
                
                {selectedShopId && items.length === 0 && <div className="text-center py-20 text-muted-foreground">Esta loja está vazia.</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {items.map(item => {
                      const price = parseInt(item.price as any) || 0;
                      const isInfinite = item.quantity === -1;
                      const isSoldOut = !isInfinite && item.quantity <= 0;
                      const canAfford = totalPlayerOrtegas >= price;
                      const cleanDescription = item.description?.replace(/<[^>]*>?/gm, '') || "";

                      return (
                        <div key={item.id} className={`border rounded-lg p-3 flex flex-col justify-between transition-colors ${isSoldOut ? "bg-destructive/5 border-destructive/20 opacity-70" : "bg-muted/10 hover:bg-muted/30"}`}>
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="font-bold flex items-center gap-2">
                                        {item.name}
                                        {isSoldOut && <span className="text-[10px] text-destructive uppercase font-bold border border-destructive px-1 rounded">Esgotado</span>}
                                    </span>
                                    <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1">
                                        {item.data?.category === 'service' ? 'Serviço' : `${item.weight} peso`} 
                                        <Weight className="w-3 h-3"/>
                                    </Badge>
                                </div>
                                
                                {/* ESTOQUE DISPLAY */}
                                <div className="mt-1 mb-1">
                                    {isInfinite ? (
                                        <span className="text-[10px] text-accent flex items-center gap-1"><InfinityIcon className="w-3 h-3"/> Estoque Infinito</span>
                                    ) : (
                                        <span className={`text-[10px] font-mono ${item.quantity < 3 ? "text-orange-500" : "text-muted-foreground"}`}>
                                            Estoque: {item.quantity}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                     {item.data?.damage && <span className="text-[10px] border px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">Dano: {item.data.damage}</span>}
                                     {item.data?.protection && <span className="text-[10px] border px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">Prot: {item.data.protection}</span>}
                                </div>

                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cleanDescription}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className={`font-bold text-lg ${canAfford ? "text-accent" : "text-destructive"}`}>
                                   {formatPrice(price)}
                                </span>
                                <Button 
                                   size="sm" 
                                   onClick={() => handleBuy(item)} 
                                   disabled={!!buyingId || !canAfford || isSoldOut}
                                   variant={canAfford ? "default" : "secondary"}
                                >
                                   {buyingId === item.id ? "..." : (item.data?.category === 'service' ? "Contratar" : "Comprar")}
                                </Button>
                            </div>
                        </div>
                      );
                   })}
                </div>
            </ScrollArea>
         </CardContent>
      </Card>
    </div>
  );
};