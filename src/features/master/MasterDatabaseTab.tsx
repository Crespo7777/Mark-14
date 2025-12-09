import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Sword, Shield, FlaskConical, Backpack, Gem, 
  PawPrint, Zap, Dna, Star, Box, CircleDot, Wheat, 
  Shirt, Hammer, Utensils, Sparkles, Skull, Wrench, Music,
  Loader2, Search, X
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { validateItemData } from "./database.schemas";

import { DatabaseItemCard } from "./components/DatabaseItemCard";
import { DatabaseForm } from "./components/DatabaseForm";
import { DatabaseSeeder } from "./components/DatabaseSeeder";

const CATEGORIES = [
  { id: 'quality', label: 'Qualidades', icon: Star },
  { id: 'weapon', label: 'Armas', icon: Sword },
  { id: 'armor', label: 'Armaduras', icon: Shield },
  { id: 'ability', label: 'Habilidades', icon: Zap },
  { id: 'trait', label: 'Traços & Dádivas', icon: Dna },
  { id: 'consumable', label: 'Elixires', icon: FlaskConical },
  { id: 'general', label: 'Equipamentos', icon: Backpack },
  { id: 'container', label: 'Recipientes', icon: Box },
  { id: 'ammunition', label: 'Munições', icon: CircleDot },
  { id: 'tool', label: 'Ferramenta', icon: Hammer },
  { id: 'spec_tool', label: 'Especializadas', icon: Wrench },
  { id: 'clothing', label: 'Roupas', icon: Shirt },
  { id: 'food', label: 'Comida', icon: Utensils },
  { id: 'mount', label: 'Transporte', icon: PawPrint },
  { id: 'animal', label: 'Animais', icon: Wheat },
  { id: 'construction', label: 'Construções', icon: Box }, 
  { id: 'trap', label: 'Armadilhas', icon: Skull },
  { id: 'artifact', label: 'Artefatos', icon: Sparkles },
  { id: 'musical', label: 'Instrumentos', icon: Music },
  { id: 'material', label: 'Materiais', icon: Gem },
];

const fetchItems = async (tableId: string, category: string) => {
  if (!tableId) return [];
  // Seleciona * (não podemos selecionar weight/icon_url explicitamente pois não existem)
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("type", category)
    .or(`table_id.eq.${tableId},table_id.is.null`)
    .order("name");
  if (error) throw error;
  return data;
};

export const MasterDatabaseTab = ({ tableId }: { tableId: string }) => {
  const [activeCategory, setActiveCategory] = useState("quality");

  return (
    <div className="space-y-6">
       <div className="flex justify-end">
          <DatabaseSeeder tableId={tableId} />
       </div>

       <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-muted/20">
             <div className="flex w-max space-x-2 p-4">
                <TabsList className="flex h-auto bg-transparent space-x-2">
                    {CATEGORIES.map(cat => (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="flex flex-col items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border min-w-[80px]"
                        >
                            <cat.icon className="w-5 h-5" />
                            <span className="text-xs">{cat.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
             </div>
             <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <div className="mt-4">
             <DatabaseCategoryManager tableId={tableId} category={activeCategory} />
          </div>
       </Tabs>
    </div>
  );
};

const DatabaseCategoryManager = ({ tableId, category }: { tableId: string, category: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultState = { name: "", description: "", icon_url: null, weight: "", data: {} };
  const [newItem, setNewItem] = useState<any>(defaultState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    cancelEdit();
    setSearchQuery("");
  }, [category]);

  const queryKey = ['items', tableId, category];

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchItems(tableId, category),
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false,
  });

  const filteredItems = items.filter((item: any) => {
    const term = searchQuery.toLowerCase();
    const data = item.data || {};
    const nameMatch = item.name.toLowerCase().includes(term);
    const subCategoryMatch = data.subcategory 
        ? String(data.subcategory).toLowerCase().includes(term) 
        : false;
    return nameMatch || subCategoryMatch;
  });

  const handleSave = async () => {
    if (!newItem.name) return toast({ title: "Erro", description: "O nome é obrigatório.", variant: "destructive" });
    
    const validation = validateItemData(category, newItem.data);
    if (!validation.success) {
        return toast({ title: "Erro de Validação", description: validation.error.errors[0]?.message || "Dados inválidos", variant: "destructive" });
    }

    setIsSaving(true);
    
    // --- CORREÇÃO: Guardar weight e icon_url dentro de data ---
    const payload = {
        table_id: tableId,
        type: category,
        name: newItem.name,
        description: newItem.description,
        data: {
            ...newItem.data,
            weight: parseFloat(newItem.weight) || 0,
            icon_url: newItem.icon_url
        }
    };

    try {
        let savedData;
        if (editingId) {
            const { data, error } = await supabase.from("items").update(payload).eq("id", editingId).select().single();
            if (error) throw error;
            savedData = data;
            queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
                return old ? old.map(i => i.id === editingId ? savedData : i) : [savedData];
            });
            toast({ title: "Item Atualizado!" });
        } else {
            const { data, error } = await supabase.from("items").insert(payload).select().single();
            if (error) throw error;
            savedData = data;
            queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
                return old ? [...old, savedData].sort((a,b) => a.name.localeCompare(b.name)) : [savedData];
            });
            toast({ title: "Item Criado!" });
        }
        cancelEdit();
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleEdit = (item: any) => {
      if (!item.table_id) {
          toast({ title: "Item do Sistema", description: "Use o botão de copiar para editar este item.", variant: "default" });
          return;
      }
      
      // --- CORREÇÃO: Ler weight e icon_url de data ---
      const itemData = item.data || {};
      
      setEditingId(item.id);
      setNewItem({
          name: item.name,
          description: item.description || "",
          weight: String(itemData.weight || ""), 
          icon_url: itemData.icon_url,
          data: itemData
      });
      setEditorKey(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = async (item: any) => {
      const { id, created_at, table_id, ...itemData } = item;
      // Duplicação funciona bem porque copia o objeto 'data' inteiro, onde weight e icon já estão
      const newItemPayload = { ...itemData, table_id: tableId, name: `${item.name} (Cópia)` };

      try {
          const { data, error } = await supabase.from("items").insert(newItemPayload).select().single();
          if(error) throw error;
          toast({ title: "Item Duplicado" });
          queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
              return old ? [...old, data].sort((a,b) => a.name.localeCompare(b.name)) : [data];
          });
      } catch (error: any) {
          toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
  };

  const cancelEdit = () => {
      setEditingId(null);
      setNewItem(JSON.parse(JSON.stringify(defaultState)));
      setEditorKey(p => p + 1);
  };

  const confirmDelete = async () => {
     if (!itemToDelete) return;
     const previousData = queryClient.getQueryData<any[]>(queryKey);
     queryClient.setQueryData(queryKey, (old: any[] | undefined) => old ? old.filter(i => i.id !== itemToDelete) : []);

     const { error } = await supabase.from("items").delete().eq("id", itemToDelete);
     if (error) {
        queryClient.setQueryData(queryKey, previousData);
        toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
     } else {
        toast({ title: "Item apagado" });
        if (editingId === itemToDelete) cancelEdit();
     }
     setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
       <DatabaseForm 
          tableId={tableId} 
          category={category} 
          data={newItem} 
          onChange={setNewItem} 
          onSave={handleSave} 
          onCancel={cancelEdit} 
          isSaving={isSaving} 
          isEditing={!!editingId} 
          editorKey={editorKey}
       />
       
       <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder={`Pesquisar...`}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-8 bg-background"
          />
          {searchQuery && (
              <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7" onClick={() => setSearchQuery("")}><X className="w-3 h-3"/></Button>
          )}
       </div>

       {isLoading ? (
           <div className="text-center py-10 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Carregando...</div>
       ) : (
           <div className="grid grid-cols-1 gap-2 pb-10">
              {filteredItems.map((item: any) => (
                  <DatabaseItemCard 
                    key={item.id} 
                    item={item} 
                    onEdit={handleEdit} 
                    onDuplicate={handleDuplicate} 
                    onDelete={setItemToDelete} 
                  />
              ))}
              {filteredItems.length === 0 && <p className="text-center text-muted-foreground py-8 italic">Nada encontrado.</p>}
           </div>
       )}
       
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
           <AlertDialogContent>
               <AlertDialogHeader>
                   <AlertDialogTitle>Apagar Item?</AlertDialogTitle>
                   <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                   <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Apagar</AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}