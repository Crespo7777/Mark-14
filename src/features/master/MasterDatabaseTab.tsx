import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, X, ShieldAlert, Plus, Filter, PackageOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import { useTableContext } from "@/features/table/TableContext";
import { validateItemData } from "@/features/systems/symbaroum/master/database.schemas";
import { CATEGORIES } from "@/features/systems/symbaroum/master/database.constants";

import { DatabaseItemCard } from "./components/DatabaseItemCard";
import { DatabaseForm } from "./components/DatabaseForm";
import { DatabaseSeeder } from "./components/DatabaseSeeder";

const ENABLE_RESET_BUTTON = false;

const fetchItems = async (tableId: string, category: string) => {
  if (!tableId) return [];
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
  const [activeCategory, setActiveCategory] = useState("quality"); // Padrão: Habilidade/Qualidade
  const { isMaster, isHelper } = useTableContext();

  if (!isMaster && !isHelper) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-destructive gap-2 p-10 bg-muted/20 rounded-xl border border-dashed m-4">
              <ShieldAlert className="w-10 h-10" />
              <p className="font-bold">Acesso Restrito ao Mestre.</p>
          </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 w-full">
       
       {/* 1. SIDEBAR (Navegação) */}
       <aside className="w-60 flex-shrink-0 flex flex-col gap-2 bg-card border rounded-lg p-2 shadow-sm">
          <div className="px-2 py-3">
             <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <PackageOpen className="w-4 h-4" /> Compêndio
             </h2>
          </div>
          <Separator className="mb-2 opacity-50" />
          
          <ScrollArea className="flex-1 pr-2">
             <div className="space-y-1">
                {CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group
                                ${isActive 
                                    ? "bg-primary text-primary-foreground shadow-md translate-x-1" 
                                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                }
                            `}
                        >
                            <cat.icon className={`w-4 h-4 transition-colors ${isActive ? "text-primary-foreground" : "text-primary/60 group-hover:text-primary"}`} />
                            <span>{cat.label}</span>
                        </button>
                    )
                })}
             </div>
          </ScrollArea>

          {ENABLE_RESET_BUTTON && (
              <div className="mt-auto border-t pt-2 px-2">
                  <div className="border border-red-500/50 p-2 rounded bg-red-500/5">
                      <p className="text-[10px] text-red-500 text-center font-bold mb-2">DEV TOOLS</p>
                      <DatabaseSeeder tableId={tableId} />
                  </div>
              </div>
          )}
       </aside>

       {/* 2. ÁREA PRINCIPAL */}
       <main className="flex-1 flex flex-col bg-card/30 border rounded-lg shadow-inner overflow-hidden relative">
          <DatabaseCategoryManager tableId={tableId} category={activeCategory} />
       </main>
    </div>
  );
};

const DatabaseCategoryManager = ({ tableId, category }: { tableId: string, category: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultState = { name: "", description: "", icon_url: null, weight: "", data: {} };
  const [newItem, setNewItem] = useState<any>(defaultState);
  
  // Controles de Estado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Controla o Modal de Criação
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

  const activeCategoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;

  const handleSave = async () => {
    if (!newItem.name) return toast({ title: "Erro", description: "O nome é obrigatório.", variant: "destructive" });
    
    const validation = validateItemData(category, newItem.data);
    if (!validation.success) {
        return toast({ title: "Erro de Validação", description: validation.error.errors[0]?.message || "Dados inválidos", variant: "destructive" });
    }

    setIsSaving(true);
    
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
      setIsCreateOpen(true); // Abre o modal para editar
  };

  const handleDuplicate = async (item: any) => {
      const { id, created_at, table_id, ...itemData } = item;
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
      setIsCreateOpen(false); // Fecha o modal
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
    <div className="flex flex-col h-full">
       
       {/* HEADER FIXO: Título, Busca e Botão Novo */}
       <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-lg font-bold truncate">{activeCategoryLabel}</h3>
                <Badge variant="secondary" className="hidden sm:flex">
                    {filteredItems.length} itens
                </Badge>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="relative w-full max-w-[240px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar..."
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="pl-9 h-9 bg-muted/50 focus:bg-background transition-colors"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                {/* BOTÃO NOVO ITEM (Abre o Modal) */}
                <Dialog open={isCreateOpen} onOpenChange={(open) => !open && cancelEdit()}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-9 shadow-sm" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2"/> <span className="hidden sm:inline">Novo Item</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Item" : `Novo ${activeCategoryLabel}`}</DialogTitle>
                            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
                        </DialogHeader>
                        
                        {/* Renderiza o Formulário dentro do Modal */}
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
                    </DialogContent>
                </Dialog>
            </div>
       </div>

       {/* ÁREA DE CONTEÚDO (Lista Vertical) */}
       <ScrollArea className="flex-1 bg-muted/10">
          <div className="p-4 pb-20">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary/50" />
                    <p>Carregando grimório...</p>
                </div>
            ) : (
                // VOLTAMOS PARA LISTA VERTICAL (flex-col) para melhor leitura
                <div className="flex flex-col gap-2">
                    {filteredItems.map((item: any) => (
                        <DatabaseItemCard 
                            key={item.id} 
                            item={item} 
                            onEdit={handleEdit} 
                            onDuplicate={handleDuplicate} 
                            onDelete={setItemToDelete} 
                        />
                    ))}
                    
                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                            <Filter className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Nenhum item encontrado</p>
                            <p className="text-sm opacity-60">Tente buscar por outro termo ou crie um novo.</p>
                        </div>
                    )}
                </div>
            )}
          </div>
       </ScrollArea>
       
       {/* DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO */}
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
           <AlertDialogContent>
               <AlertDialogHeader>
                   <AlertDialogTitle>Apagar Item?</AlertDialogTitle>
                   <AlertDialogDescription>Esta ação é irreversível e removerá o item da sua mesa.</AlertDialogDescription>
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