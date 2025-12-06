import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Weight, Infinity as InfinityIcon, Image as ImageIcon, Shield, Sword, Zap, FlaskConical, Star, Store, User, Loader2 } from "lucide-react";
import { convertFromOrtegas, convertToOrtegas, formatPrice } from "@/lib/economy-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExtendedShopItem extends ShopItem {
  data?: any;
  icon_url?: string | null;
}

const fetchShops = async (tableId: string) => {
  const { data } = await supabase.from("shops").select("*").eq("table_id", tableId).eq("is_open", true);
  return data as Shop[];
};

const fetchShopItems = async (shopId: string) => {
  const { data } = await supabase.from("shop_items").select("*").eq("shop_id", shopId);
  return data as ExtendedShopItem[];
};

const fetchMyCharacters = async (userId: string, tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("player_id", userId).eq("table_id", tableId);
  return (data || []) as CharacterWithRelations[];
};

export const PlayerShopsTab = ({ tableId, userId }: { tableId: string, userId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);

  // Queries
  const { data: shops = [] } = useQuery({ queryKey: ['shops', tableId], queryFn: () => fetchShops(tableId) });
  
  useEffect(() => {
      if (!selectedShopId && shops.length > 0) setSelectedShopId(shops[0].id);
  }, [shops, selectedShopId]);

  const { data: items = [] } = useQuery({ 
    queryKey: ['shop_items', selectedShopId], 
    queryFn: () => fetchShopItems(selectedShopId!), 
    enabled: !!selectedShopId 
  });

  const { data: myCharacters = [] } = useQuery({ 
      queryKey: ['my_characters', tableId, userId], 
      queryFn: () => fetchMyCharacters(userId, tableId) 
  });

  useEffect(() => {
      if (!activeCharacterId && myCharacters.length > 0) {
          setActiveCharacterId(myCharacters[0].id);
      }
  }, [myCharacters, activeCharacterId]);

  const activeCharacter = myCharacters.find(c => c.id === activeCharacterId);
  
  const currentMoney = activeCharacter ? (activeCharacter.data as any).money : { taler:0, shekel:0, ortega:0 };
  const totalPlayerOrtegas = convertToOrtegas(currentMoney);

  const handleBuy = async (item: ExtendedShopItem) => {
    if (!activeCharacter) {
        toast({ title: "Selecione um Personagem", description: "Você precisa escolher quem está comprando.", variant: "destructive" });
        return;
    }
    
    const price = parseInt(item.price as any) || 0;
    const playerMoney = parseInt(totalPlayerOrtegas as any) || 0;
    const isInfinite = item.quantity === -1;

    if (playerMoney < price) {
      toast({ title: "Saldo Insuficiente", variant: "destructive" });
      return;
    }

    if (!isInfinite && item.quantity <= 0) {
        toast({ title: "Esgotado!", description: "Este item não está mais disponível.", variant: "destructive" });
        return;
    }
    
    setBuyingId(item.id);

    const newTotalOrtegas = playerMoney - price;
    const newMoney = convertFromOrtegas(newTotalOrtegas);
    const currentInventory = (activeCharacter.data as any).inventory || [];
    const isService = item.data?.category === 'service';
    
    let newInventory = currentInventory;

    if (!isService) {
        const newItemObj = {
            id: crypto.randomUUID(),
            name: item.name,
            quantity: 1,
            weight: item.weight,
            description: item.description,
            icon_url: item.icon_url,
            category: item.data?.category || 'general',
            data: item.data || {} 
        };
        newInventory = [...currentInventory, newItemObj];
    }
    
    const newData = { 
      ...(activeCharacter.data as any), 
      money: newMoney, 
      inventory: newInventory 
    };

    const queryKeyChar = ['my_characters', tableId, userId];
    
    queryClient.setQueryData(queryKeyChar, (old: CharacterWithRelations[] | undefined) => {
        if (!old) return old;
        return old.map(c => c.id === activeCharacter.id ? { ...c, data: newData } : c);
    });

    if (!isInfinite) {
        queryClient.setQueryData(['shop_items', selectedShopId], (old: ExtendedShopItem[] | undefined) => {
            return old ? old.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i) : [];
        });
    }

    const successMessage = isService 
        ? `Serviço "${item.name}" adquirido.`
        : `-${formatPrice(price)}. ${item.name} adicionado à mochila de ${activeCharacter.name}.`;

    toast({ title: "Compra Efetuada!", description: successMessage });

    try {
        await supabase.from("characters").update({ data: newData }).eq("id", activeCharacter.id);

        if (!isInfinite) {
            const { error } = await supabase.rpc('decrement_shop_item_quantity', { row_id: item.id });
            if (error) {
                 await supabase.from("shop_items").update({ quantity: item.quantity - 1 }).eq("id", item.id);
            }
        }

        await supabase.from("chat_messages").insert({
            table_id: tableId,
            user_id: userId,
            message: `💰 **${activeCharacter.name}** comprou **${item.name}** por ${formatPrice(price)}.`,
            message_type: "info"
        });
        
        queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });
        if (!isInfinite) queryClient.invalidateQueries({ queryKey: ['shop_items', selectedShopId] });

    } catch (err) {
        toast({ title: "Erro na compra", description: "Falha de sincronização.", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: queryKeyChar });
    }
    
    setBuyingId(null);
  };

  const renderItemStats = (item: ExtendedShopItem) => {
      const data = item.data || {};
      return (
          <div className="flex flex-wrap gap-1.5 mt-2">
              {data.damage && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-500/30 text-red-500 bg-red-500/5 gap-1"><Sword className="w-3 h-3"/> {data.damage}</Badge>}
              {data.protection && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-500/30 text-slate-500 bg-slate-500/5 gap-1"><Shield className="w-3 h-3"/> {data.protection}</Badge>}
              {data.powerLevel && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-purple-500/30 text-purple-500 bg-purple-500/5 gap-1"><Zap className="w-3 h-3"/> Poder {data.powerLevel}</Badge>}
              {data.duration && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-green-500/30 text-green-500 bg-green-500/5 gap-1"><FlaskConical className="w-3 h-3"/> {data.duration}</Badge>}
              {data.quality && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted/50 border border-border gap-1"><Star className="w-3 h-3 text-yellow-500/70"/> {data.quality}</Badge>}
          </div>
      );
  };

  if (!userId) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      
      {/* CABEÇALHO E SELETOR (Fixo no topo) */}
      <div className="shrink-0 space-y-4 bg-background pb-2">
          <div className="flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-none">Mercado</h3>
                    <p className="text-xs text-muted-foreground mt-1">Compre equipamentos e suprimentos.</p>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:w-48">
                    <Select value={activeCharacterId || ""} onValueChange={setActiveCharacterId} disabled={myCharacters.length === 0}>
                        <SelectTrigger className="h-10 bg-background border-primary/20">
                            <SelectValue placeholder="Selecione Comprador" />
                        </SelectTrigger>
                        <SelectContent>
                            {myCharacters.length === 0 ? (
                                <SelectItem value="none" disabled>Sem Personagens</SelectItem>
                            ) : (
                                myCharacters.map(char => (
                                    <SelectItem key={char.id} value={char.id}>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            {char.name}
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-right bg-background/80 px-4 py-2 rounded-lg border border-accent/20 shadow-sm min-w-[100px]">
                    <div className="text-lg font-mono text-accent font-black flex items-center justify-end gap-1">
                        {formatPrice(totalPlayerOrtegas)}
                    </div>
                </div>
            </div>
          </div>

          {/* SELETOR DE LOJAS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {shops.length === 0 && <p className="text-sm text-muted-foreground px-4 italic w-full text-center">Nenhuma loja aberta.</p>}
            {shops.map(shop => (
            <Button 
                key={shop.id} 
                variant={selectedShopId === shop.id ? "default" : "outline"}
                onClick={() => setSelectedShopId(shop.id)}
                className="whitespace-nowrap shadow-sm h-8 text-xs"
            >
                {shop.name}
            </Button>
            ))}
          </div>
      </div>

      {/* ÁREA DE ITENS (Scrollável e Flexível) */}
      <div className="flex-1 min-h-0 border rounded-lg bg-muted/5 overflow-hidden relative">
          <ScrollArea className="h-full w-full">
              <div className="p-4">
                {!selectedShopId && shops.length > 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                        <ShoppingBag className="w-10 h-10 opacity-20" />
                        <p>Selecione uma loja para ver o estoque.</p>
                    </div>
                )}
                {selectedShopId && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                        <ShoppingBag className="w-10 h-10 opacity-20" />
                        <p>Esta loja está vazia.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {items.map(item => {
                      const price = parseInt(item.price as any) || 0;
                      const isInfinite = item.quantity === -1;
                      const isSoldOut = !isInfinite && item.quantity <= 0;
                      const canAfford = totalPlayerOrtegas >= price;
                      const cleanDescription = item.description?.replace(/<[^>]*>?/gm, '') || "";

                      return (
                        <div key={item.id} className={`relative group border rounded-xl p-3 flex flex-col justify-between transition-all bg-card hover:border-primary/40 hover:shadow-md ${isSoldOut ? "opacity-60 grayscale bg-muted" : ""}`}>
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl font-mono font-bold text-xs shadow-sm z-10 ${canAfford ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                                {formatPrice(price)}
                            </div>

                            <div className="flex gap-3 mb-3 pr-8">
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50 overflow-hidden shadow-inner mt-1">
                                    {item.icon_url ? (
                                        <img src={item.icon_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-sm truncate block leading-tight" title={item.name}>{item.name}</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.weight > 0 && <Badge variant="outline" className="text-[9px] h-4 px-1 bg-background">{item.weight} kg</Badge>}
                                        {!isInfinite ? (
                                            <span className={`text-[9px] px-1.5 rounded border font-mono ${item.quantity < 3 ? "bg-red-100 text-red-600 border-red-200" : "bg-muted text-muted-foreground"}`}>
                                                Restam: {item.quantity}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-muted-foreground flex items-center"><InfinityIcon className="w-3 h-3 mr-0.5"/> Infinito</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                {renderItemStats(item)}
                            </div>
                            
                            {cleanDescription && (
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 h-8 px-1">
                                    {cleanDescription}
                                </p>
                            )}

                            <Button 
                               size="sm" 
                               onClick={() => handleBuy(item)} 
                               disabled={!!buyingId || !canAfford || isSoldOut || !activeCharacter}
                               className="w-full font-bold shadow-sm h-8 text-xs"
                               variant={canAfford ? "default" : "outline"}
                            >
                               {buyingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (item.data?.category === 'service' ? "Contratar" : (activeCharacter ? "Comprar" : "Selecione Personagem"))}
                            </Button>
                        </div>
                      );
                   })}
                </div>
              </div>
          </ScrollArea>
      </div>
    </div>
  );
};