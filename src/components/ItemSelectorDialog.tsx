import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Plus, Package, Shield, Sword, Zap, FlaskConical, Gem, Sparkles, 
  PawPrint, HandCoins, Dna, Box, CircleDot, Hammer, Wrench, Shirt, 
  Utensils, Castle, Skull, Music, Coins, Star, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ItemTemplate } from "@/types/app-types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemSelectorDialogProps {
  tableId: string;
  categories?: string[];
  category?: string;
  children?: React.ReactNode; 
  onSelect: (template: ItemTemplate | null) => void;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// --- FUNÇÃO DE BUSCA BLINDADA (SEM WEIGHT E SEM ICON_URL) ---
const fetchItemsForSelector = async (tableId: string, categories: string[]) => {
  // 1. Formatar categorias para Title Case (ex: 'weapon' -> 'Weapon')
  const formattedCategories = categories.map(c => 
      c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
  );

  let query = supabase
    .from("items")
    // --- CORREÇÃO FINAL: Selecionamos APENAS as colunas que existem de certeza ---
    .select("id, name, description, type, data") 
    .eq("table_id", tableId)
    .order("name");
    
  if (categories.length > 0) {
      query = query.in("type", formattedCategories);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao buscar itens no seletor:", error);
    throw error;
  }
  
  // 2. Mapeamento seguro dos dados
  return data.map((item: any) => {
      // Extração segura de dados que podem não estar em colunas próprias
      const itemData = item.data || {};
      const itemWeight = itemData.weight || 0;
      // Tenta encontrar a URL da imagem dentro do JSON 'data', em várias propriedades possíveis
      const imageUrl = itemData.icon_url || itemData.image_url || itemData.img || null;

      return {
        ...item,
        category: item.type ? item.type.toLowerCase() : "general",
        image_url: imageUrl, // Usa a imagem encontrada no JSON
        weight: itemWeight,  // Usa o peso encontrado no JSON
        data: itemData
      };
  }) as ItemTemplate[];
};

export const ItemSelectorDialog = ({ tableId, categories, category, children, onSelect, title, open: controlledOpen, onOpenChange }: ItemSelectorDialogProps) => {
  const targetCategories = categories || (category ? [category] : []);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [activeTab, setActiveTab] = useState(targetCategories[0] || "all");

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
    }, 300); 
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (targetCategories.length > 0) {
        setActiveTab(targetCategories[0]);
    }
  }, [JSON.stringify(targetCategories)]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items_selector', tableId, targetCategories.join(',')], 
    queryFn: () => fetchItemsForSelector(tableId, targetCategories),
    enabled: isOpen, 
  });

  const filteredItems = items.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesTab = targetCategories.length > 1 
        ? (i.category || "").toLowerCase() === activeTab.toLowerCase() 
        : true;
        
      return matchesSearch && matchesTab;
  });

  const handleSelect = (item: ItemTemplate | null) => {
    onSelect(item);
    setIsOpen(false);
  };

  const getIcon = (cat: string) => {
    const normalizedCat = (cat || "").toLowerCase();
    switch(normalizedCat) {
        case 'quality': return <Star className="w-4 h-4"/>;
        case 'weapon': return <Sword className="w-4 h-4"/>;
        case 'armor': return <Shield className="w-4 h-4"/>;
        case 'ability': return <Zap className="w-4 h-4"/>;
        case 'trait': return <Dna className="w-4 h-4"/>;
        case 'consumable': return <FlaskConical className="w-4 h-4"/>;
        case 'general': return <Package className="w-4 h-4"/>;
        case 'container': return <Box className="w-4 h-4"/>;
        case 'ammunition': return <CircleDot className="w-4 h-4"/>;
        case 'tool': return <Hammer className="w-4 h-4"/>;
        case 'spec_tool': return <Wrench className="w-4 h-4"/>;
        case 'clothing': return <Shirt className="w-4 h-4"/>;
        case 'food': return <Utensils className="w-4 h-4"/>;
        case 'mount': return <PawPrint className="w-4 h-4"/>;
        case 'animal': return <PawPrint className="w-4 h-4"/>;
        case 'construction': return <Castle className="w-4 h-4"/>;
        case 'trap': return <Skull className="w-4 h-4"/>;
        case 'artifact': return <Sparkles className="w-4 h-4"/>;
        case 'musical': return <Music className="w-4 h-4"/>;
        case 'asset': return <Coins className="w-4 h-4"/>;
        case 'material': return <Gem className="w-4 h-4"/>;
        case 'service': return <HandCoins className="w-4 h-4"/>;
        default: return <Package className="w-4 h-4"/>;
    }
  };

  const getLabel = (cat: string) => {
      const normalizedCat = (cat || "").toLowerCase();
      switch(normalizedCat) {
          case 'quality': return "Qualidades";
          case 'weapon': return "Armas";
          case 'armor': return "Armaduras";
          case 'ability': return "Habilidades";
          case 'trait': return "Traços";
          case 'consumable': return "Elixires";
          case 'general': return "Equipamento";
          case 'container': return "Recipientes";
          case 'ammunition': return "Munição";
          case 'tool': return "Ferramenta";
          case 'spec_tool': return "Especiais";
          case 'clothing': return "Roupas";
          case 'food': return "Comida";
          case 'mount': return "Montaria";
          case 'animal': return "Animal";
          case 'construction': return "Construção";
          case 'trap': return "Armadilha";
          case 'artifact': return "Artefato";
          case 'musical': return "Musical";
          case 'asset': return "Proventos";
          case 'material': return "Materiais";
          case 'service': return "Serviços";
          default: return "Outros";
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {targetCategories.length === 1 ? getIcon(targetCategories[0]) : <Package className="w-4 h-4"/>} 
             {title || "Selecionar Item"}
          </DialogTitle>
          <DialogDescription>Escolha do compêndio.</DialogDescription>
        </DialogHeader>

        {targetCategories.length > 1 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 justify-start w-full">
                    {targetCategories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1.5 flex-1 capitalize">
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
                
                {isLoading && (
                    <div className="space-y-2 py-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
                
                {!isLoading && filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors bg-card"
                        onClick={() => handleSelect(item)}
                    >
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                            {item.image_url ? ( 
                                <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                                getIcon(item.category) 
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-2">
                                    {item.name}
                                    {item.data?.price && <span className="text-[10px] font-normal text-muted-foreground border px-1 rounded bg-muted/50">{item.data.price}</span>}
                                </span>
                                {item.category !== 'ability' && item.category !== 'trait' && (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        {item.weight} peso
                                    </Badge>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {item.description.replace(/<[^>]*>?/gm, '')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                
                {!isLoading && filteredItems.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">
                        Nenhum item encontrado nesta categoria.
                    </p>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};