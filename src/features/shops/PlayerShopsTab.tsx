// src/features/shops/PlayerShopsTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Coins, Weight } from "lucide-react";
import { convertFromOrtegas, convertToOrtegas } from "@/lib/economy-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetchShops = async (tableId: string) => {
  const { data } = await supabase.from("shops").select("*").eq("table_id", tableId);
  return data as Shop[];
};

const fetchShopItems = async (shopId: string) => {
  const { data } = await supabase.from("shop_items").select("*").eq("shop_id", shopId);
  return data as ShopItem[];
};

const fetchMyCharacter = async (userId: string, tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("player_id", userId).eq("table_id", tableId).maybeSingle();
  return data as CharacterWithRelations | null;
};

export const PlayerShopsTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  // Dados
  const { data: shops = [] } = useQuery({ queryKey: ['shops', tableId], queryFn: () => fetchShops(tableId) });
  const { data: items = [] } = useQuery({ 
    queryKey: ['shop_items', selectedShopId], 
    queryFn: () => fetchShopItems(selectedShopId!), 
    enabled: !!selectedShopId 
  });
  const { data: character } = useQuery({ queryKey: ['my_character_money', tableId, userId], queryFn: () => fetchMyCharacter(userId, tableId) });

  // Cálculos
  const currentMoney = character ? (character.data as any).money : { taler:0, shekel:0, ortega:0 };
  const totalPlayerOrtegas = convertToOrtegas(currentMoney);

  const handleBuy = async (item: ShopItem) => {
    if (!character) return;
    if (totalPlayerOrtegas < item.price) {
      toast({ title: "Sem dinheiro!", description: `Você precisa de mais ${item.price - totalPlayerOrtegas} Ortegas.`, variant: "destructive" });
      return;
    }
    
    setIsBuying(true);

    // 1. Calcular novo saldo
    const newTotalOrtegas = totalPlayerOrtegas - item.price;
    const newMoney = convertFromOrtegas(newTotalOrtegas);

    // 2. Adicionar item ao inventário
    const newItemObj = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: 1,
      weight: item.weight,
      description: item.description
    };
    const currentInventory = (character.data as any).inventory || [];
    const newInventory = [...currentInventory, newItemObj];

    // 3. Atualizar ficha no banco
    const newData = { 
      ...(character.data as any), 
      money: newMoney, 
      inventory: newInventory 
    };

    const { error } = await supabase.from("characters").update({ data: newData }).eq("id", character.id);

    if (error) {
      toast({ title: "Erro na compra", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item comprado!", description: `-${item.price} Ortegas. ${item.name} adicionado.` });
      queryClient.invalidateQueries({ queryKey: ['my_character_money', tableId, userId] });
      // Feedback no Chat
      await supabase.from("chat_messages").insert({
        table_id: tableId,
        user_id: userId,
        message: `💰 **${character.name}** comprou **${item.name}** por ${item.price} ortegas.`,
        message_type: "info"
      });
    }
    setIsBuying(false);
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
                {totalPlayerOrtegas} <Coins className="w-3 h-3"/>
            </div>
            <span className="text-[10px] text-muted-foreground">Seu Saldo (Total em Ortegas)</span>
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
        {shops.length === 0 && <p className="text-sm text-muted-foreground px-4">Nenhuma loja disponível na região.</p>}
      </div>

      <Card className="flex-1">
         <CardContent className="p-0 h-[500px]">
            <ScrollArea className="h-full p-4">
                {!selectedShopId && <div className="text-center py-20 text-muted-foreground">Selecione uma loja acima.</div>}
                
                {selectedShopId && items.length === 0 && <div className="text-center py-20 text-muted-foreground">Esta loja está vazia.</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {items.map(item => (
                      <div key={item.id} className="border rounded-lg p-3 flex flex-col justify-between bg-muted/10 hover:bg-muted/30 transition-colors">
                          <div>
                              <div className="flex justify-between items-start">
                                  <span className="font-bold">{item.name}</span>
                                  <Badge variant="outline" className="font-mono">{item.weight} <Weight className="w-3 h-3 ml-1"/></Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                              <span className={`font-bold text-lg ${totalPlayerOrtegas >= item.price ? "text-accent" : "text-destructive"}`}>
                                 {item.price} $
                              </span>
                              <Button 
                                 size="sm" 
                                 onClick={() => handleBuy(item)} 
                                 disabled={isBuying || totalPlayerOrtegas < item.price}
                                 variant={totalPlayerOrtegas >= item.price ? "default" : "secondary"}
                              >
                                 Comprar
                              </Button>
                          </div>
                      </div>
                   ))}
                </div>
            </ScrollArea>
         </CardContent>
      </Card>
    </div>
  );
};