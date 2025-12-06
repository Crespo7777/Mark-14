import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shop } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; 
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Trash2, Lock, Unlock, Eye, EyeOff, MapPin, ShoppingBag, ArrowLeft } from "lucide-react";
import { ShopManager } from "./components/ShopManager";
import { Badge } from "@/components/ui/badge";
import { useTableContext } from "@/features/table/TableContext"; // Para pegar userId
import { PlayerShopsTab } from "@/features/shops/PlayerShopsTab"; // Importar a visão do jogador

const fetchShops = async (tableId: string) => {
  const { data, error } = await supabase.from("shops").select("*").eq("table_id", tableId).order("created_at");
  if (error) throw error;
  return data as (Shop & { is_open: boolean })[];
};

export const MasterShopsTab = ({ tableId }: { tableId: string }) => {
  const { userId } = useTableContext(); // Necessário para o modo comprador
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newShopName, setNewShopName] = useState("");
  const [selectedShop, setSelectedShop] = useState<(Shop & { is_open: boolean }) | null>(null);
  const [globalShopsOpen, setGlobalShopsOpen] = useState(false);
  
  // ESTADO DE MODO (Gestão vs Compras)
  const [isShoppingMode, setIsShoppingMode] = useState(false);

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
      toast({ title: "Loja Criada!" });
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

  // --- MODO COMPRADOR (Renderiza a visão de Player) ---
  if (isShoppingMode) {
      return (
          <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 px-2">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <span className="font-bold text-sm">Modo Comprador (Ajudante/Mestre)</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsShoppingMode(false)}>
                      <ArrowLeft className="mr-2 h-4 w-4"/> Voltar à Gestão
                  </Button>
              </div>
              
              <div className="flex-1 min-h-0">
                  {/* Reutiliza a aba de jogador, passando o userId do mestre/ajudante */}
                  <PlayerShopsTab tableId={tableId} userId={userId} />
              </div>
          </div>
      );
  }

  // --- MODO GESTÃO (Visão Original) ---
  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      {/* Barra de Controlo Global */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-muted/20 p-4 rounded-xl border border-primary/10">
          <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`p-3 rounded-full transition-all ${globalShopsOpen ? "bg-green-500/20 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-muted text-muted-foreground"}`}>
                    <Store className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Gestão de Mercado</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Switch id="global-shop-toggle" checked={globalShopsOpen} onCheckedChange={handleToggleGlobalShop} />
                        <Label htmlFor="global-shop-toggle" className="text-xs text-muted-foreground cursor-pointer">
                            {globalShopsOpen ? "Aba Visível aos Jogadores" : "Aba Oculta"}
                        </Label>
                    </div>
                </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center">
            {/* Botão para alternar para o modo de compra */}
            <Button variant="outline" onClick={() => setIsShoppingMode(true)} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                <ShoppingBag className="w-4 h-4" /> Ir às Compras
            </Button>

            <div className="h-8 w-px bg-border mx-2" />

            <Input 
                placeholder="Nome da Nova Loja..." 
                value={newShopName} 
                onChange={e => setNewShopName(e.target.value)} 
                className="bg-background"
            />
            <Button onClick={handleCreateShop} disabled={!newShopName.trim()}><Plus className="w-4 h-4 mr-2" /> Criar</Button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LISTA DE LOJAS (COLUNA ESQUERDA) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-2 h-full max-h-[calc(100vh-250px)]">
            {shops.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>Sem lojas criadas.</p>
                </div>
            )}
            
            {shops.map(shop => (
              <div 
                key={shop.id} 
                onClick={() => setSelectedShop(shop)}
                className={`
                    group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden
                    ${selectedShop?.id === shop.id 
                        ? "bg-accent/10 border-accent shadow-md ring-1 ring-accent/20" 
                        : "bg-card hover:bg-accent/5 hover:border-accent/50"
                    }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${selectedShop?.id === shop.id ? "text-accent" : "text-muted-foreground"}`} />
                        <span className="font-bold text-lg leading-none">{shop.name}</span>
                    </div>
                    {shop.is_open ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] h-5 gap-1">
                            <Eye className="w-3 h-3" /> Aberta
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-[10px] h-5 gap-1 opacity-70">
                            <EyeOff className="w-3 h-3" /> Fechada
                        </Badge>
                    )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground font-mono">ID: {shop.id.slice(0,4)}...</span>
                    <div className="flex gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-background" 
                            onClick={(e) => handleToggleShopVisibility(shop, e)}
                            title={shop.is_open ? "Fechar Loja" : "Abrir Loja"}
                        >
                            {shop.is_open ? <Unlock className="w-3.5 h-3.5 text-green-600"/> : <Lock className="w-3.5 h-3.5 text-muted-foreground"/>}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
              </div>
            ))}
        </div>

        {/* GESTOR DE ESTOQUE (COLUNA DIREITA) */}
        <div className="lg:col-span-8 h-full min-h-[500px]">
          {selectedShop ? (
            <ShopManager shop={selectedShop} tableId={tableId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/5 text-muted-foreground p-10">
              <Store className="w-16 h-16 opacity-10 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma loja selecionada</h3>
              <p className="text-sm max-w-xs text-center mt-2">Selecione uma loja à esquerda para gerir o inventário, ou clique em "Ir às Compras" para comprar itens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};