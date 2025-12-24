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

// --- FUNÇÃO DE BUSCA COM TRAVA DE SEGURANÇA ---
const fetchItemsForSelector = async (tableId: string, categories: string[]) => {
    // 1. TRAVA DE SEGURANÇA: Se o ID for inválido ou a string "undefined", paramos aqui.
    if (!tableId || tableId === "undefined" || tableId === "null") {
        console.warn("ItemSelectorDialog: tableId inválido, abortando busca.");
        return [];
    }

    const targetCategories = categories.map(c => c.toLowerCase());

    let query = supabase
        .from("items")
        .select("id, name, description, type, data") 
        .or(`table_id.eq.${tableId},table_id.is.null`) 
        .order("name");
        
    if (targetCategories.length > 0) {
        query = query.in("type", targetCategories); 
    }

    const { data, error } = await query;
    
    if (error) {
        console.error("Erro ao buscar itens no seletor:", error);
        throw error;
    }
    
    return data.map((item: any) => {
            const itemData = item.data || {};
            const itemWeight = itemData.weight || 0;
            const imageUrl = itemData.icon_url || itemData.image_url || itemData.img || null;

            return {
                ...item,
                category: item.type ? item.type.toLowerCase() : "general",
                image_url: imageUrl,
                weight: itemWeight,
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
        const timer = setTimeout(() => setDebouncedSearch(search), 300); 
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (targetCategories.length > 0) setActiveTab(targetCategories[0]);
    }, [JSON.stringify(targetCategories)]);

    // 2. REACT QUERY: Só ativa a busca se tivermos um ID de mesa real e o diálogo estiver aberto
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['items_selector', tableId, targetCategories.join(',')], 
        queryFn: () => fetchItemsForSelector(tableId, targetCategories),
        enabled: isOpen && !!tableId && tableId !== "undefined", 
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
                default: return <Package className="w-4 h-4"/>;
        }
    };

    const getLabel = (cat: string) => {
            const normalizedCat = (cat || "").toLowerCase();
            switch(normalizedCat) {
                    case 'weapon': return "Armas";
                    case 'armor': return "Armaduras";
                    case 'ability': return "Habilidades";
                    case 'trait': return "Traços";
                    case 'general': return "Equipamento";
                    default: return "Itens";
            }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-foreground/80">
                            {targetCategories.length === 1 ? getIcon(targetCategories[0]) : <Package className="w-5 h-5"/>} 
                            {title || "Selecionar Item"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-40">Compêndio da Mesa</DialogDescription>
                </DialogHeader>

                {targetCategories.length > 1 && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="flex flex-wrap h-auto bg-muted/30 p-1 justify-start w-full border border-border/40">
                                        {targetCategories.map(cat => (
                                                <TabsTrigger key={cat} value={cat} className="text-[10px] px-3 py-1.5 flex-1 uppercase font-black tracking-tighter">
                                                        {getLabel(cat)}
                                                </TabsTrigger>
                                        ))}
                                </TabsList>
                        </Tabs>
                )}

                <div className="relative my-3 group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Pesquisar..." 
                        className="pl-9 h-10 bg-black/20 border-border/40 focus:ring-1 focus:ring-primary/30" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4 h-[350px]">
                        <div className="space-y-2 pb-4">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start border-dashed border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/5 transition-all h-10" 
                                    onClick={() => handleSelect(null)}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Novo Customizado
                                </Button>
                                
                                {isLoading ? (
                                        <div className="space-y-3 py-4">
                                                <Skeleton className="h-14 w-full rounded-lg opacity-20" />
                                                <Skeleton className="h-14 w-full rounded-lg opacity-20" />
                                        </div>
                                ) : filteredItems.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="group flex items-center gap-3 p-3 border border-border/40 rounded-xl hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all bg-card/40"
                                            onClick={() => handleSelect(item)}
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center shrink-0 overflow-hidden border border-white/5 shadow-inner">
                                                {item.image_url ? ( 
                                                        <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                                ) : (
                                                        <div className="opacity-40">{getIcon(item.category)}</div> 
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-black text-sm uppercase tracking-tight text-foreground/90">
                                                            {item.name}
                                                    </span>
                                                    {item.category !== 'ability' && item.category !== 'trait' && (
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 border border-border/40 px-1.5 py-0.5 rounded">
                                                            {item.weight} PESO
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5 italic">
                                                            {item.description.replace(/<[^>]*>?/gm, '')}
                                                    </p>
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