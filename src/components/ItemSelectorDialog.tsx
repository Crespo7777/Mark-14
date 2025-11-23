// src/components/ItemSelectorDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Package, Shield, Sword, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ItemTemplate } from "@/types/app-types";
import { Badge } from "@/components/ui/badge";

interface ItemSelectorDialogProps {
  tableId: string;
  category: 'weapon' | 'armor' | 'item' | 'ability';
  children: React.ReactNode;
  onSelect: (template: ItemTemplate | null) => void; // null significa "Customizado"
}

export const ItemSelectorDialog = ({ tableId, category, children, onSelect }: ItemSelectorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      supabase
        .from("item_templates")
        .select("*")
        .eq("table_id", tableId)
        .eq("category", category)
        .order("name")
        .then(({ data }) => {
          if (data) setItems(data as any);
          setLoading(false);
        });
    }
  }, [open, tableId, category]);

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (item: ItemTemplate | null) => {
    onSelect(item);
    setOpen(false);
  };

  const getIcon = () => {
    switch(category) {
        case 'weapon': return <Sword className="w-4 h-4"/>;
        case 'armor': return <Shield className="w-4 h-4"/>;
        case 'ability': return <Zap className="w-4 h-4"/>;
        default: return <Package className="w-4 h-4"/>;
    }
  }

  const getTitle = () => {
      switch(category) {
          case 'weapon': return "Selecionar Arma";
          case 'armor': return "Selecionar Armadura";
          case 'ability': return "Selecionar Habilidade";
          default: return "Selecionar Item";
      }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {getIcon()} {getTitle()}
          </DialogTitle>
          <DialogDescription>Escolha da base de dados ou crie um novo.</DialogDescription>
        </DialogHeader>

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

        <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-2">
                <Button 
                    variant="outline" 
                    className="w-full justify-start border-dashed" 
                    onClick={() => handleSelect(null)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Criar Customizado (Vazio)
                </Button>
                
                {loading && <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>}
                
                {!loading && filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        className="flex flex-col p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelect(item)}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-bold">{item.name}</span>
                            {category !== 'ability' && <Badge variant="secondary" className="text-xs">{item.weight} peso</Badge>}
                        </div>
                        {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        )}
                        
                        {/* Detalhes extra baseados no tipo */}
                        <div className="flex gap-2 mt-2 text-xs opacity-80">
                            {category === 'weapon' && (
                                <>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Dano: {item.data.damage}</span>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Atq: {item.data.attackAttribute}</span>
                                </>
                            )}
                            {category === 'armor' && (
                                <>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Prot: {item.data.protection}</span>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Obst: {item.data.obstructive}</span>
                                </>
                            )}
                             {category === 'ability' && (
                                <>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Nível: {item.data.level}</span>
                                    <span className="bg-background/50 px-1.5 py-0.5 rounded border">Custo: {item.data.corruptionCost}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};