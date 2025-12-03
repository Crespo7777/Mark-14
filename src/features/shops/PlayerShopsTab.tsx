// src/features/shops/PlayerShopsTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Weight, Infinity as InfinityIcon, Image as ImageIcon, Shield, Sword, Zap, FlaskConical, Star } from "lucide-react";
import { convertFromOrtegas, convertToOrtegas, formatPrice } from "@/lib/economy-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtendedShopItem extends ShopItem {
  data?: any;
  icon_url?: string | null;
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

    if (!isInfinite && item.quantity <= 0) {
        toast({ title: "Esgotado!", description: "Este item não está mais disponível.", variant: "destructive" });
        return;
    }
    
    setBuyingId(item.id);

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
            icon_url: item.icon_url,
            category: item.data?.category || 'general',
            data: item.data || {} 
        };
        newInventory = [...currentInventory, newItemObj];
    }
    
    const newData = { 
      ...(character.data as any), 
      money: newMoney, 
      inventory: newInventory 
    };

    const queryKeyChar = ['my_character_money', tableId, userId];
    const previousCharacter = queryClient.getQueryData(queryKeyChar);
    
    // Optimistic Updates
    queryClient.setQueryData(queryKeyChar, (old: any) => { if (!old) return old; return { ...old, data: newData }; });

    if (!isInfinite) {
        queryClient.setQueryData(['shop_items', selectedShopId], (old: ExtendedShopItem[] | undefined) => {
            return old ? old.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i) : [];
        });
    }

    const successMessage = isService 
        ? `Serviço "${item.name}" adquirido.`
        : `-${formatPrice(price)}. ${item.name} adicionado.`;

    toast({ title: "Compra realizada!", description: successMessage });

    try {
        await supabase.from("characters").update({ data: newData }).eq("id", character.id);

        if (!isInfinite) {
            // Tenta usar a função segura, se falhar (por não existir no DB), tenta update direto (fallback)
            const { error } = await supabase.rpc('decrement_shop_item_quantity', { row_id: item.id });
            if (error) {
                 console.warn("RPC falhou, tentando update manual:", error);
                 await supabase.from("shop_items").update({ quantity: item.quantity - 1 }).eq("id", item.id);
            }
        }

        await supabase.from("chat_messages").insert({
            table_id: tableId,
            user_id: userId,
            message: `💰 **${character.name}** ${isService ? "pagou por" : "comprou"} **${item.name}** por ${formatPrice(price)}.${isService ? " (Serviço)" : ""}`,
            message_type: "info"
        });
        
        queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });
        if (!isInfinite) queryClient.invalidateQueries({ queryKey: ['shop_items', selectedShopId] });

    } catch (err) {
        console.error(err);
        toast({ title: "Erro na compra", description: "Verifique a conexão.", variant: "destructive" });
        queryClient.setQueryData(queryKeyChar, previousCharacter);
        queryClient.invalidateQueries({ queryKey: ['shop_items', selectedShopId] });
    }
    
    setBuyingId(null);
  };

  // --- RENDERIZADOR INTELIGENTE (Detecta propriedades em vez de categorias) ---
  const renderItemStats = (item: ExtendedShopItem) => {
      const data = item.data || {};
      
      return (
          <div className="flex flex-wrap gap-1.5 mt-2">
              {/* STATUS DE ARMA */}
              {data.damage && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-500/30 text-red-500 bg-red-500/5 gap-1" title="Dano">
                      <Sword className="w-3 h-3"/> {data.damage}
                  </Badge>
              )}
              {data.attackAttribute && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-blue-500/30 text-blue-500 bg-blue-500/5" title="Atributo">
                      {data.attackAttribute}
                  </Badge>
              )}

              {/* STATUS DE ARMADURA */}
              {data.protection && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-500/30 text-slate-500 bg-slate-500/5 gap-1" title="Proteção">
                      <Shield className="w-3 h-3"/> {data.protection}
                  </Badge>
              )}
              {data.obstructive && data.obstructive !== "0" && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-500/30 text-orange-500 bg-orange-500/5" title="Penalidade">
                      Obs: {data.obstructive}
                  </Badge>
              )}

              {/* MÍSTICO / CONSUMÍVEL */}
              {data.powerLevel && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-purple-500/30 text-purple-500 bg-purple-500/5 gap-1">
                      <Zap className="w-3 h-3"/> Poder {data.powerLevel}
                  </Badge>
              )}
              {data.corruption && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-purple-900/30 text-purple-700 bg-purple-500/5">
                      Corr: {data.corruption}
                  </Badge>
              )}
              {data.duration && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-green-500/30 text-green-500 bg-green-500/5 gap-1">
                      <FlaskConical className="w-3 h-3"/> {data.duration}
                  </Badge>
              )}

              {/* QUALIDADES (SEMPRE MOSTRA SE EXISTIR) */}
              {data.quality && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted/50 border border-border gap-1">
                      <Star className="w-3 h-3 text-yellow-500/70"/> {data.quality}
                  </Badge>
              )}
          </div>
      );
  };

  if (!character) return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4">
          <ShoppingBag className="w-12 h-12 opacity-20" />
          <p>Você precisa de uma ficha de personagem nesta mesa para acessar o mercado.</p>
      </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* CABEÇALHO DO SALDO */}
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div>
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><ShoppingBag className="w-5 h-5"/> Mercado</h3>
            <p className="text-xs text-muted-foreground">Compre equipamentos e suprimentos.</p>
        </div>
        <div className="text-right bg-background/50 px-3 py-1.5 rounded-md border border-border/50">
            <div className="text-sm font-mono text-accent font-bold flex items-center justify-end gap-1">
                {formatPrice(totalPlayerOrtegas)}
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Seu Saldo</span>
        </div>
      </div>

      {/* SELETOR DE LOJAS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {shops.map(shop => (
           <Button 
              key={shop.id} 
              variant={selectedShopId === shop.id ? "default" : "outline"}
              onClick={() => setSelectedShopId(shop.id)}
              className="whitespace-nowrap shadow-sm"
           >
              {shop.name}
           </Button>
        ))}
        {shops.length === 0 && <p className="text-sm text-muted-foreground px-4 italic">O mestre ainda não abriu nenhuma loja.</p>}
      </div>

      {/* ÁREA DE ITENS */}
      <Card className="flex-1 border-t-0 rounded-t-none md:border-t md:rounded-lg overflow-hidden bg-transparent shadow-none border-none">
         <CardContent className="p-0 h-[calc(100vh-280px)] min-h-[400px]">
            <ScrollArea className="h-full pr-4">
                {!selectedShopId && shops.length > 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                        <ShoppingBag className="w-10 h-10 opacity-20" />
                        <p>Selecione uma loja acima para ver o estoque.</p>
                    </div>
                )}
                
                {selectedShopId && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                        <Package className="w-10 h-10 opacity-20" />
                        <p>Esta loja parece estar vazia no momento.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-20">
                   {items.map(item => {
                      const price = parseInt(item.price as any) || 0;
                      const isInfinite = item.quantity === -1;
                      const isSoldOut = !isInfinite && item.quantity <= 0;
                      const canAfford = totalPlayerOrtegas >= price;
                      const cleanDescription = item.description?.replace(/<[^>]*>?/gm, '') || "";

                      return (
                        <div key={item.id} className={`group border rounded-lg p-3 flex flex-col justify-between transition-all bg-card shadow-sm hover:shadow-md hover:border-primary/40 ${isSoldOut ? "opacity-60 grayscale bg-muted" : ""}`}>
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 w-full">
                                        {/* Ícone */}
                                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border/50 overflow-hidden shadow-inner">
                                            {item.icon_url ? (
                                                <img src={item.icon_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm truncate pr-2">{item.name}</span>
                                                {isSoldOut && <span className="text-[9px] text-destructive uppercase font-bold border border-destructive px-1 rounded bg-destructive/5">Esgotado</span>}
                                            </div>
                                            
                                            <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5 items-center">
                                                <span className="flex items-center gap-1 bg-muted/50 px-1.5 rounded"><Weight className="w-3 h-3"/> {item.weight}</span>
                                                {isInfinite ? (
                                                    <span className="text-accent flex items-center gap-1"><InfinityIcon className="w-3 h-3"/> Infinito</span>
                                                ) : (
                                                    <span className={`${item.quantity < 3 ? "text-orange-500 font-bold" : ""}`}>Estoque: {item.quantity}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* DETALHES DINÂMICOS (Correção Principal) */}
                                {renderItemStats(item)}

                                {cleanDescription && (
                                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed opacity-80 pl-1 border-l-2 border-primary/20">
                                        {cleanDescription}
                                    </p>
                                )}
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center pt-3 border-t border-dashed border-border/60">
                                <span className={`font-bold text-base font-mono ${canAfford ? "text-accent" : "text-muted-foreground"}`}>
                                   {formatPrice(price)}
                                </span>
                                <Button 
                                   size="sm" 
                                   onClick={() => handleBuy(item)} 
                                   disabled={!!buyingId || !canAfford || isSoldOut}
                                   variant={canAfford ? "default" : "secondary"}
                                   className={`h-8 text-xs px-4 transition-all ${canAfford ? "hover:scale-105 shadow-sm" : "opacity-80"}`}
                                >
                                   {buyingId === item.id ? <span className="animate-pulse">Comprando...</span> : (item.data?.category === 'service' ? "Contratar" : "Comprar")}
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