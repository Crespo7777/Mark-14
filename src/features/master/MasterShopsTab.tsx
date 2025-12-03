// src/features/master/MasterShopsTab.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; 
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Trash2, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { ShopManager } from "./components/ShopManager";

const fetchShops = async (tableId: string) => {
  const { data, error } = await supabase.from("shops").select("*").eq("table_id", tableId).order("created_at");
  if (error) throw error;
  return data as (Shop & { is_open: boolean })[];
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
    if(!confirm("Apagar esta loja e todos os itens dela?")) return;
    await supabase.from("shops").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['shops', tableId] });
    if (selectedShop?.id === id) setSelectedShop(null);
  };

  const handleToggleShopVisibility = async (shop: Shop & { is_open: boolean }, e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !shop.is_open;
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
            <ShopManager shop={selectedShop} tableId={tableId} />
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