// src/components/ItemSelectorDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package, Shield, Sword, Zap, FlaskConical, Gem, Sparkles, PawPrint, HandCoins, Dna } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ItemTemplate } from "@/types/app-types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ItemSelectorDialogProps {
  tableId: string;
  categories?: string[]; // Agora opcional
  category?: string;     // Suporte para legado (singular)
  children: React.ReactNode;
  onSelect: (template: ItemTemplate | null) => void;
  title?: string;
}

export const ItemSelectorDialog = ({ tableId, categories, category, children, onSelect, title }: ItemSelectorDialogProps) => {
  // LÓGICA DE SEGURANÇA: Usa 'categories' se existir, senão usa 'category' num array, senão array vazio.
  const targetCategories = categories || (category ? [category] : []);
  
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // Evita erro se o array estiver vazio
  const [activeTab, setActiveTab] = useState(targetCategories[0] || "");

  useEffect(() => {
    if (open && targetCategories.length > 0) {
      setLoading(true);
      const categoryToFetch = targetCategories.length > 1 ? activeTab : targetCategories[0];
      
      // Se o activeTab estiver vazio (caso inicial), define-o
      if (!activeTab) setActiveTab(categoryToFetch);

      let query = supabase
        .from("item_templates")
        .select("*")
        .eq("table_id", tableId)
        .order("name");
        
      if (targetCategories.length > 1 && activeTab) {
         query = query.eq("category", activeTab);
      } else {
         // Se só tem uma categoria ou activeTab ainda não setou, busca por todas as permitidas
         query = query.in("category", targetCategories);
      }

      query.then(({ data }) => {
          if (data) setItems(data as any);
          setLoading(false);
        });
    }
  }, [open, tableId, activeTab, targetCategories.join(",")]); // Dependência em string para evitar loops com arrays

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (item: ItemTemplate | null) => {
    onSelect(item);
    setOpen(false);
  };

  const getIcon = (cat: string) => {
    switch(cat) {
        case 'weapon': return <Sword className="w-4 h-4"/>;
        case 'armor': return <Shield className="w-4 h-4"/>;
        case 'ability': return <Zap className="w-4 h-4"/>;
        case 'trait': return <Dna className="w-4 h-4"/>;
        case 'consumable': return <FlaskConical className="w-4 h-4"/>;
        case 'material': return <Gem className="w-4 h-4"/>;
        case 'mystic': return <Sparkles className="w-4 h-4"/>;
        case 'mount': return <PawPrint className="w-4 h-4"/>;
        case 'service': return <HandCoins className="w-4 h-4"/>;
        default: return <Package className="w-4 h-4"/>;
    }
  };

  const getLabel = (cat: string) => {
      switch(cat) {
          case 'weapon': return "Armas";
          case 'armor': return "Armaduras";
          case 'ability': return "Habilidades";
          case 'trait': return "Traços";
          case 'consumable': return "Consumíveis";
          case 'general': return "Geral";
          case 'material': return "Materiais";
          case 'mystic': return "Místicos";
          case 'mount': return "Montarias";
          case 'service': return "Serviços";
          default: return "Itens";
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {targetCategories.length === 1 ? getIcon(targetCategories[0]) : <Package className="w-4 h-4"/>} 
             {title || "Selecionar Item"}
          </DialogTitle>
          <DialogDescription>Escolha do compêndio ou crie um item customizado.</DialogDescription>
        </DialogHeader>

        {targetCategories.length > 1 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 justify-start">
                    {targetCategories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1.5">
                            {getLabel(cat)}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        )}

        <div className="flex gap-2 my-2">
           <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-8" 
                value={search} 
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 h-[300px]">
            <div className="space-y-2">
                <Button 
                    variant="outline" 
                    className="w-full justify-start border-dashed text-muted-foreground hover:text-foreground" 
                    onClick={() => handleSelect(null)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Criar Customizado (Vazio)
                </Button>
                
                {loading && <p className="text-center text-sm text-muted-foreground py-4">Carregando Compêndio...</p>}
                
                {!loading && filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        className="flex flex-col p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors bg-card"
                        onClick={() => handleSelect(item)}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2">
                                {item.name}
                                {item.data.price && <span className="text-[10px] font-normal text-muted-foreground border px-1 rounded">{item.data.price}</span>}
                            </span>
                            {item.category !== 'ability' && item.category !== 'trait' && <Badge variant="secondary" className="text-xs">{item.weight} peso</Badge>}
                        </div>
                        {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        )}
                        
                        <div className="flex gap-2 mt-2 text-[10px] opacity-80 flex-wrap">
                             {item.data.damage && <span className="bg-background/50 px-1.5 py-0.5 rounded border">Dano: {item.data.damage}</span>}
                             {item.data.protection && <span className="bg-background/50 px-1.5 py-0.5 rounded border">Prot: {item.data.protection}</span>}
                             {item.data.effect && <span className="bg-background/50 px-1.5 py-0.5 rounded border text-purple-500">Efeito: {item.data.effect}</span>}
                             {item.data.corruption && <span className="bg-background/50 px-1.5 py-0.5 rounded border text-destructive">Corr: {item.data.corruption}</span>}
                             {item.data.level && <span className="bg-background/50 px-1.5 py-0.5 rounded border">Nível: {item.data.level}</span>}
                        </div>
                    </div>
                ))}
                
                {!loading && filteredItems.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum item encontrado.</p>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};