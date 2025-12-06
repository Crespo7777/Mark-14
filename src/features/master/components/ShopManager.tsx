import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop, ShopItem, CharacterWithRelations, ItemTemplate } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Database, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { ItemIconUploader } from "@/components/ItemIconUploader";
import { QualitySelector } from "@/components/QualitySelector";
import { ShopItemCard } from "./ShopItemCard";

import { 
    CATEGORIES, 
    WEAPON_SUBCATEGORIES, 
    ARMOR_SUBCATEGORIES, 
    FOOD_SUBCATEGORIES,
    RPG_ATTRIBUTES 
} from "../database.constants";

interface ExtendedShopItem extends ShopItem {
  data?: any;
  icon_url?: string | null;
}

const TRADEABLE_CATEGORIES = CATEGORIES.filter(cat => cat.id !== 'trait' && cat.id !== 'quality');
const IMPORT_CATEGORY_IDS = TRADEABLE_CATEGORIES.map(c => c.id);

const fetchShopItems = async (shopId: string) => {
  const { data, error } = await supabase.from("shop_items").select("*").eq("shop_id", shopId).order("name");
  if (error) throw error;
  return data as ExtendedShopItem[];
};

const fetchCharacters = async (tableId: string) => {
  const { data } = await supabase.from("characters").select("*").eq("table_id", tableId);
  return (data || []) as CharacterWithRelations[];
};

export const ShopManager = ({ shop, tableId }: { shop: Shop, tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newItem, setNewItem] = useState({ 
      name: "", amount: 0, weight: 0, stock: -1, description: "", 
      category: "general", icon_url: null as string | null, data: {} as any 
  });
  
  const [currencyType, setCurrencyType] = useState<"ortega" | "shekel" | "taler">("ortega");
  const [isAdding, setIsAdding] = useState(false);

  const queryKey = ['shop_items', shop.id];
  const { data: items = [] } = useQuery({ queryKey: queryKey, queryFn: () => fetchShopItems(shop.id) });
  const { data: characters = [] } = useQuery({ queryKey: ['characters', tableId], queryFn: () => fetchCharacters(tableId) });

  useEffect(() => { setNewItem(prev => ({ ...prev, data: {} })); }, [newItem.category]);

  const updateData = (key: string, value: any) => { setNewItem(prev => ({ ...prev, data: { ...prev.data, [key]: value } })); };

  // RENDERIZADOR DE CAMPOS (IDÊNTICO AO DATABASE FORM PARA CONSISTÊNCIA)
  const renderSpecificFields = () => {
    switch (newItem.category) {
        case 'weapon': return (
            <div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 rounded border border-dashed">
                <div className="col-span-2 md:col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Subcategoria</Label>
                    <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Tipo de Arma" /></SelectTrigger>
                        <SelectContent>{WEAPON_SUBCATEGORIES.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 md:col-span-1">
                    <Label className="text-[10px] text-muted-foreground">Atributo</Label>
                    <Select value={newItem.data.attackAttribute || ""} onValueChange={v => updateData('attackAttribute', v)}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Atributo" /></SelectTrigger>
                        <SelectContent>{RPG_ATTRIBUTES.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Dano</Label>
                    <Input placeholder="Ex: 1d8" value={newItem.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="h-8 text-xs bg-background"/>
                </div>
                <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Qualidades</Label>
                    <QualitySelector tableId={tableId} value={newItem.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="weapon" />
                </div>
            </div>
        );
        case 'armor': return (
            <div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 rounded border border-dashed">
                <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                    <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Classe" /></SelectTrigger>
                        <SelectContent>{ARMOR_SUBCATEGORIES.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div><Label className="text-[10px]">Proteção</Label><Input placeholder="Ex: 1d4" value={newItem.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="h-8 text-xs bg-background"/></div>
                <div><Label className="text-[10px]">Penalidade</Label><Input placeholder="Ex: 2" type="number" value={newItem.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="h-8 text-xs bg-background"/></div>
                <div className="col-span-2"><Label className="text-[10px]">Qualidades</Label><QualitySelector tableId={tableId} value={newItem.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="armor" /></div>
            </div>
        );
        case 'consumable': return (<div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 rounded border border-dashed"><div className="col-span-2"><Label className="text-[10px]">Efeito</Label><Input placeholder="Ex: Cura 1d4" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} className="h-8 text-xs bg-background"/></div><div><Label className="text-[10px]">Duração</Label><Input placeholder="Ex: Cena" value={newItem.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="h-8 text-xs bg-background"/></div><div><Label className="text-[10px]">Uso</Label><Input placeholder="Ex: Beber" value={newItem.data.usage || ""} onChange={e => updateData('usage', e.target.value)} className="h-8 text-xs bg-background"/></div></div>);
        case 'food': return (<div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 rounded border border-dashed"><div className="col-span-2"><Label className="text-[10px]">Tipo</Label><Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{FOOD_SUBCATEGORIES.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent></Select></div></div>);
        default: return null;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name) return toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" });
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
      quantity: newItem.stock,
      description: newItem.description,
      icon_url: newItem.icon_url,
      data: { category: newItem.category, ...newItem.data }
    };

    try {
        const { data, error } = await supabase.from("shop_items").insert(payload).select().single();
        if (error) throw error;
        queryClient.setQueryData(queryKey, (old: ExtendedShopItem[] | undefined) => {
            return old ? [...old, data].sort((a,b) => a.name.localeCompare(b.name)) : [data];
        });
        setNewItem(prev => ({ ...prev, name: "", amount: 0, weight: 0, description: "", icon_url: null, data: {} })); 
        setCurrencyType("ortega");
        toast({ title: "Item Adicionado" });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setIsAdding(false);
    }
  };

  const handleImport = async (template: ItemTemplate | null) => {
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

     const correctCategory = (template as any).type || template.category || 'general';

     try {
         const { data, error } = await supabase.from("shop_items").insert({
            shop_id: shop.id,
            name: template.name,
            description: template.description,
            weight: template.weight,
            price: price,
            quantity: -1, 
            icon_url: template.image_url || template.icon_url,
            data: { ...template.data, category: correctCategory }
         }).select().single();
         
         if (error) throw error;
         
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

  const handleDelete = async (id: string) => {
    const prev = queryClient.getQueryData<ExtendedShopItem[]>(queryKey);
    queryClient.setQueryData(queryKey, (old: any) => old ? old.filter((i:any) => i.id !== id) : []);
    const { error } = await supabase.from("shop_items").delete().eq("id", id);
    if (error) {
        queryClient.setQueryData(queryKey, prev);
        toast({ title: "Erro ao apagar", variant: "destructive" });
    }
  };

  const handleSendLoot = async (item: ExtendedShopItem, charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    
    const isService = item.data?.category === 'service';
    const currentInventory = (char.data as any).inventory || [];
    let newInventory = currentInventory;

    if (!isService) {
        newInventory = [...currentInventory, {
            id: crypto.randomUUID(),
            name: item.name,
            quantity: 1,
            weight: item.weight,
            description: item.description || "Presente do Mestre",
            icon_url: item.icon_url,
            category: item.data?.category || 'general',
            data: item.data || {}
        }];
    }

    const { error } = await supabase.from("characters").update({ 
        data: { ...(char.data as any), inventory: newInventory } 
    }).eq("id", charId);

    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Enviado!", description: `Entregue a ${char.name}.` });
      await supabase.from("chat_messages").insert({
        table_id: tableId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        message: `🎁 **${char.name}** recebeu **${item.name}**!`,
        message_type: "info"
      });
    }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="pb-3 px-0 pt-0">
        <CardTitle className="text-2xl text-foreground">{shop.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="px-0 space-y-6 flex-1 flex flex-col min-h-0">
        
        {/* FORMULÁRIO (Card destacado) */}
        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-4">
            <div className="flex gap-4 items-start">
                <ItemIconUploader 
                    currentUrl={newItem.icon_url} 
                    onUpload={(url) => setNewItem(prev => ({...prev, icon_url: url}))}
                    onRemove={() => setNewItem(prev => ({...prev, icon_url: null}))}
                />
                <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                        <Label className="text-xs">Nome do Item</Label>
                        <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ex: Poção de Cura" className="h-9 bg-background" />
                    </div>
                    <div className="col-span-4">
                        <Label className="text-xs">Categoria</Label>
                        <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                            <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TRADEABLE_CATEGORIES.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id} className="flex items-center gap-2">
                                        <cat.icon className="w-3 h-3" /> {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-12">
                        <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição rápida..." className="h-9 bg-background" />
                    </div>
                </div>
            </div>

            {renderSpecificFields()}

            <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                    <Label className="text-xs">Preço</Label>
                    <Input type="number" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: parseInt(e.target.value)||0})} className="h-9 bg-background" />
                </div>
                <div className="col-span-3">
                    <Label className="text-xs">Moeda</Label>
                    <Select value={currencyType} onValueChange={(v: any) => setCurrencyType(v)}>
                        <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="taler">Táler</SelectItem><SelectItem value="shekel">Xelim</SelectItem><SelectItem value="ortega">Ortega</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="col-span-3">
                    <Label className="text-xs">Peso</Label>
                    <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)||0})} className="h-9 bg-background" />
                </div>
                <div className="col-span-3">
                    <Label className="text-xs">Estoque</Label>
                    <div className="relative">
                        <Input 
                            type={newItem.stock === -1 ? "text" : "number"} 
                            value={newItem.stock === -1 ? "Infinito" : newItem.stock} 
                            onChange={e => {
                                const val = e.target.value;
                                if(val === "-1") setNewItem({...newItem, stock: -1});
                                else setNewItem({...newItem, stock: parseInt(val)||0});
                            }} 
                            className={`h-9 pr-8 bg-background ${newItem.stock === -1 ? "text-accent font-bold" : ""}`}
                        />
                        <Button 
                             size="icon" variant="ghost" 
                             className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-accent"
                             onClick={() => setNewItem({...newItem, stock: newItem.stock === -1 ? 1 : -1})}
                             title="Alternar Infinito"
                        >
                             <InfinityIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={handleAddItem} className="flex-1 h-9 text-sm font-semibold shadow-sm" disabled={isAdding}>
                    {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />} 
                    Adicionar à Loja
                </Button>
                
                <ItemSelectorDialog 
                    tableId={tableId} 
                    categories={IMPORT_CATEGORY_IDS}
                    onSelect={handleImport}
                    title="Importar do Compêndio"
                >
                        <Button variant="outline" className="h-9 gap-2" disabled={isAdding}>
                        <Database className="w-4 h-4" /> Importar
                        </Button>
                </ItemSelectorDialog>
            </div>
        </div>

        <Separator className="my-4" />

        {/* LISTA DE ITENS */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-10">
           {items.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm italic border-2 border-dashed rounded-xl">A loja está vazia. Adicione itens acima.</p>}
           {items.map(item => (
                <ShopItemCard 
                    key={item.id} 
                    item={item} 
                    characters={characters}
                    onDelete={handleDelete}
                    onSendLoot={handleSendLoot}
                />
           ))}
        </div>
      </CardContent>
    </Card>
  );
};