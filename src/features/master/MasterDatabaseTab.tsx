// src/features/master/MasterDatabaseTab.tsx

import { useState, useEffect, Suspense, lazy, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, Sword, Shield, FlaskConical, Backpack, Gem, 
  PawPrint, Zap, Dna, Star, Save, X, Search, 
  Castle, Box, CircleDot, Wheat, Coins, 
  Shirt, Hammer, Utensils, Sparkles, Skull, Wrench, Music,
  Loader2, Image as ImageIcon, Globe, Lock, Copy 
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea"; 
import { QualitySelector } from "@/components/QualitySelector"; 
import { ItemIconUploader } from "@/components/ItemIconUploader";
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

const RichTextEditor = lazy(() => 
  import("@/components/RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

// --- LISTA DE CATEGORIAS (SEM PROVENTOS) ---
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
  { id: 'construction', label: 'Construções', icon: Castle },
  { id: 'trap', label: 'Armadilhas', icon: Skull },
  { id: 'artifact', label: 'Artefatos', icon: Sparkles },
  { id: 'musical', label: 'Instrumentos', icon: Music },
  // 'asset' (Proventos) removido daqui
  { id: 'material', label: 'Materiais', icon: Gem },
];

// --- LISTA OFICIAL DE ATRIBUTOS ---
const RPG_ATTRIBUTES = [
    "Astuto", 
    "Discreto", 
    "Persuasivo", 
    "Preciso", 
    "Rápido", 
    "Resoluto", 
    "Vigilante", 
    "Vigoroso"
];

const WEAPON_SUBCATEGORIES = ["Arma de uma Mão", "Arma Curta", "Arma Longa", "Arma Pesada", "Arma de Arremesso", "Arma de Projétil", "Ataque Desarmado", "Escudo", "Armas de Cerco"];
const ARMOR_SUBCATEGORIES = ["Leve", "Média", "Pesada"];
const FOOD_SUBCATEGORIES = ["Bebidas", "Carne", "Chás", "Ensopados", "Mingau", "Peixe", "Sobremesas", "Sopas", "Tortas"];

// --- FETCH ---
const fetchItems = async (tableId: string, category: string) => {
  if (!tableId) return [];
  
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("type", category)
    .or(`table_id.eq.${tableId},table_id.is.null`)
    .order("name");
    
  if (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
  }
  return data;
};

// --- CARTÃO DE ITEM ---
const DatabaseItemCard = memo(({ item, onEdit, onDuplicate, onDelete }: any) => {
    const isGlobal = !item.table_id;
    
    return (
        <div 
            className="flex gap-3 p-3 border rounded-md bg-card hover:bg-accent/50 group cursor-pointer transition-all items-start relative overflow-hidden shadow-sm" 
            onClick={() => onEdit(item)}
        >
            {isGlobal && (
                <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-500 p-1 rounded-bl-md z-10" title="Item do Sistema (Global)">
                    <Globe className="w-3 h-3" />
                </div>
            )}

            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
                {item.icon_url ? (
                    <img src={item.icon_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2 flex-wrap text-sm">
                    {item.name}
                    {item.data.subcategory && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-primary/10 text-primary border-primary/20">{item.data.subcategory}</span>}
                    {item.data.reloadAction && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-accent/10 text-accent border-accent/20">Recarga: {item.data.reloadAction}</span>}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description?.replace(/<[^>]*>?/gm, '') || "Sem descrição."}
                </div>
            </div>

            <div className="flex items-center gap-2 self-center mr-2">
                {item.weight > 0 && (
                    <div className="text-xs text-muted-foreground border px-2 py-1 rounded bg-muted/30 whitespace-nowrap hidden sm:block">
                            {item.weight} peso
                    </div>
                )}
                
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-primary opacity-0 group-hover:opacity-100 transition-all h-8 w-8" onClick={(e) => { e.stopPropagation(); onDuplicate(item); }} title="Duplicar">
                        <Copy className="w-4 h-4" />
                    </Button>

                    {isGlobal ? (
                        <div className="p-2 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/50 h-8 w-8 flex items-center justify-center">
                            <Lock className="w-4 h-4" />
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});
DatabaseItemCard.displayName = "DatabaseItemCard";

// --- COMPONENTE PRINCIPAL ---
export const MasterDatabaseTab = ({ tableId }: { tableId: string }) => {
  const [activeCategory, setActiveCategory] = useState("quality");

  return (
    <div className="space-y-6">
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

// --- GESTOR DE CATEGORIA ---
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

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchItems(tableId, category),
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false,
  });

  const filteredItems = items.filter((item: any) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(term);
    const subCategoryMatch = item.data.subcategory 
        ? String(item.data.subcategory).toLowerCase().includes(term) 
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
    const payload = {
        table_id: tableId,
        type: category,
        name: newItem.name,
        description: newItem.description,
        weight: parseFloat(newItem.weight) || 0,
        icon_url: newItem.icon_url,
        data: newItem.data
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
      setEditingId(item.id);
      setNewItem({
          name: item.name,
          description: item.description || "",
          weight: String(item.weight || ""), 
          icon_url: item.icon_url,
          data: item.data || {}
      });
      setEditorKey(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const updateData = (key: string, value: string) => {
     setNewItem((prev: any) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const renderSpecificFields = () => {
      switch (category) {
        case 'quality': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Alvo (Arma/Armadura...)" value={newItem.data.targetType || ""} onChange={e => updateData('targetType', e.target.value)} className="bg-background col-span-2"/><Input placeholder="Efeito Resumido" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} className="bg-background col-span-2"/></div>);
        case 'trait': return (<div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Select value={newItem.data.type || "Traço"} onValueChange={v => updateData('type', v)}><SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="Traço">Traço</SelectItem><SelectItem value="Dádiva">Dádiva</SelectItem><SelectItem value="Fardo">Fardo</SelectItem><SelectItem value="Monstruoso">Traço de Criatura</SelectItem></SelectContent></Select><Input placeholder="Custo / Pontos" value={newItem.data.cost || ""} onChange={e => updateData('cost', e.target.value)} className="bg-background"/></div><div className="space-y-2 border-t pt-2"><Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label><Textarea placeholder="Novato..." className="h-14 bg-background" value={newItem.data.novice || ""} onChange={e => updateData('novice', e.target.value)} /><Textarea placeholder="Adepto..." className="h-14 bg-background" value={newItem.data.adept || ""} onChange={e => updateData('adept', e.target.value)} /><Textarea placeholder="Mestre..." className="h-14 bg-background" value={newItem.data.master || ""} onChange={e => updateData('master', e.target.value)} /></div></div>);
        case 'weapon': { 
            const isReloadable = newItem.data.subcategory === "Arma de Projétil" || newItem.data.subcategory === "Arma de Arremesso"; 
            return (
                <div className="grid grid-cols-2 gap-3">
                    <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                        <SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
                        <SelectContent>{WEAPON_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent>
                    </Select>
                    
                    <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="bg-background"/>
                    
                    {/* SELECT CORRIGIDO */}
                    <Select value={newItem.data.attackAttribute || ""} onValueChange={v => updateData('attackAttribute', v)}>
                       <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo de Ataque" /></SelectTrigger>
                       <SelectContent>
                          {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr} value={attr}>{attr}</SelectItem>)}
                       </SelectContent>
                    </Select>

                    <div className="col-span-2"><Label className="text-xs">Qualidades</Label><QualitySelector tableId={tableId} value={newItem.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="weapon" /></div>
                    {isReloadable && (<Input placeholder="Recarga (ex: Ação Livre)" value={newItem.data.reloadAction || ""} onChange={e => updateData('reloadAction', e.target.value)} className="bg-background col-span-2 md:col-span-1 border-accent/50"/>)}
                    <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className={`${isReloadable ? "col-span-2 md:col-span-1" : "col-span-2"} bg-background`}/>
                </div>
            ); 
        }
        case 'armor': return (
            <div className="grid grid-cols-2 gap-3">
                <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                    <SelectTrigger className="col-span-2 bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{ARMOR_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent>
                </Select>
                <Input placeholder="Proteção" value={newItem.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="bg-background"/>
                <Input placeholder="Penalidade" value={newItem.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="bg-background"/>
                <div className="col-span-2"><Label className="text-xs">Qualidades</Label><QualitySelector tableId={tableId} value={newItem.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="armor" /></div>
                <Input placeholder="Preço" className="col-span-2 bg-background" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} />
            </div>
        );
        case 'ability': return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Select value={newItem.data.type || "Habilidade"} onValueChange={v => updateData('type', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                    </Select>
                    <Input placeholder="Custo Corr." value={newItem.data.corruptionCost || ""} onChange={e => updateData('corruptionCost', e.target.value)} className="bg-background"/>
                    
                    {/* SELECT CORRIGIDO */}
                    <Select value={newItem.data.associatedAttribute || ""} onValueChange={v => updateData('associatedAttribute', v)}>
                       <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo Base" /></SelectTrigger>
                       <SelectContent>
                          {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr} value={attr}>{attr}</SelectItem>)}
                       </SelectContent>
                    </Select>

                    <Input placeholder="Tradição" value={newItem.data.tradition || ""} onChange={e => updateData('tradition', e.target.value)} className="bg-background"/>
                </div>
                <div className="space-y-2 border-t pt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
                    <Textarea placeholder="Novato..." className="h-14 bg-background" value={newItem.data.novice || ""} onChange={e => updateData('novice', e.target.value)} />
                    <Textarea placeholder="Adepto..." className="h-14 bg-background" value={newItem.data.adept || ""} onChange={e => updateData('adept', e.target.value)} />
                    <Textarea placeholder="Mestre..." className="h-14 bg-background" value={newItem.data.master || ""} onChange={e => updateData('master', e.target.value)} />
                </div>
            </div>
        );
        case 'consumable': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
        case 'artifact': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Efeito Mágico" className="col-span-2 bg-background" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} /><Input placeholder="Corrupção" value={newItem.data.corruption || ""} onChange={e => updateData('corruption', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
        default: return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="col-span-2 bg-background"/></div>);
      }
  };

  if (error) return <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded">Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6">
       <Card className={`border-dashed border-2 transition-colors ${editingId ? "bg-accent/5 border-accent" : "bg-muted/20"}`}>
          <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {editingId ? "Editando Item" : "Novo Item"}
                  </h3>
                  {editingId && <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="w-4 h-4 mr-1"/> Cancelar</Button>}
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                 <div className="shrink-0 flex justify-center md:justify-start">
                    <ItemIconUploader 
                        currentUrl={newItem.icon_url}
                        onUpload={(url) => setNewItem((prev: any) => ({ ...prev, icon_url: url }))}
                        onRemove={() => setNewItem((prev: any) => ({ ...prev, icon_url: null }))}
                    />
                 </div>

                 <div className="flex-1 space-y-4">
                     <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8 space-y-2">
                            <Label>Nome</Label>
                            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome do item..." className="bg-background" />
                        </div>
                        {category !== 'ability' && category !== 'quality' && category !== 'trait' && (
                            <div className="col-span-4 space-y-2">
                                <Label>Peso</Label>
                                <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} className="bg-background" />
                            </div>
                        )}
                     </div>
                     {renderSpecificFields()}
                 </div>
              </div>

              <div className="space-y-2">
                 <Label>Descrição Completa</Label>
                 <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                    <RichTextEditor 
                        key={`${editingId || 'new'}-${category}-${editorKey}`}
                        value={newItem.description} 
                        onChange={val => setNewItem({...newItem, description: val})} 
                        placeholder="Regras e detalhes..." 
                    />
                 </Suspense>
              </div>

              <div className="flex justify-end pt-2">
                 <Button onClick={handleSave} className="w-full sm:w-auto" disabled={isSaving}>
                     {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} 
                     {editingId ? "Salvar Alterações" : "Adicionar ao Database"}
                 </Button>
              </div>
          </CardContent>
       </Card>
       
       <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder={`Pesquisar em ${CATEGORIES.find(c => c.id === category)?.label}...`}
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