// src/features/master/MasterDatabaseTab.tsx

import { useState, useEffect, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ItemTemplate } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Trash2, Sword, Shield, FlaskConical, Backpack, Gem, 
  PawPrint, Zap, Dna, Star, Save, X, Search, 
  Image as ImageIcon, Castle, Box, CircleDot, Wheat, Coins, 
  Shirt, Hammer, Utensils, Sparkles, Skull, Wrench, Music,
  Loader2 
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea"; 
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

const RichTextEditor = lazy(() => 
  import("@/components/RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

const CATEGORIES = [
  { id: 'quality', label: 'Qualidades', icon: Star },
  { id: 'weapon', label: 'Armamentos', icon: Sword },
  { id: 'armor', label: 'Proteção', icon: Shield },
  { id: 'ability', label: 'Habilidades & Poderes', icon: Zap },
  { id: 'trait', label: 'Traços & Dádivas', icon: Dna },
  { id: 'consumable', label: 'Elixires Alquímicos', icon: FlaskConical },
  { id: 'general', label: 'Equipamentos', icon: Backpack },
  { id: 'container', label: 'Recipientes', icon: Box },
  { id: 'ammunition', label: 'Munições', icon: CircleDot },
  { id: 'tool', label: 'Ferramenta', icon: Hammer },
  { id: 'spec_tool', label: 'Ferr. Especializadas', icon: Wrench },
  { id: 'clothing', label: 'Roupas', icon: Shirt },
  { id: 'food', label: 'Comida e bebida', icon: Utensils },
  { id: 'mount', label: 'Transporte', icon: PawPrint },
  { id: 'animal', label: 'Animais de Fazenda', icon: Wheat },
  { id: 'construction', label: 'Construções', icon: Castle },
  { id: 'trap', label: 'Armadilhas', icon: Skull },
  { id: 'artifact', label: 'Artefatos Menores', icon: Sparkles },
  { id: 'musical', label: 'Instr. Musicais', icon: Music },
  { id: 'asset', label: 'Proventos', icon: Coins },
  { id: 'material', label: 'Materiais', icon: Gem },
  // "Serviços" removido daqui
];

const WEAPON_SUBCATEGORIES = [
  "Arma de uma Mão", "Arma Curta", "Arma Longa", "Arma Pesada",
  "Arma de Arremesso", "Arma de Projétil", "Ataque Desarmado", "Escudo", "Armas de Cerco"
];

const ARMOR_SUBCATEGORIES = ["Leve", "Média", "Pesada"];
const FOOD_SUBCATEGORIES = ["Bebidas", "Carne", "Chás", "Ensopados", "Mingau", "Peixe", "Sobremesas", "Sopas", "Tortas"];

const fetchTemplates = async (tableId: string, category: string) => {
  const { data, error } = await supabase
    .from("item_templates")
    .select("*")
    .eq("table_id", tableId)
    .eq("category", category)
    .order("name");
  if (error) throw error;
  return data as ItemTemplate[];
};

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

const DatabaseCategoryManager = ({ tableId, category }: { tableId: string, category: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultState = { name: "", description: "", image_url: "", weight: "", data: {} };
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

  const queryKey = ['item_templates', tableId, category];

  const { data: items = [] } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchTemplates(tableId, category),
  });

  const filteredItems = items.filter(item => {
    const term = searchQuery.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(term);
    const subCategoryMatch = item.data.subcategory 
        ? String(item.data.subcategory).toLowerCase().includes(term) 
        : false;
    return nameMatch || subCategoryMatch;
  });

  const handleSave = async () => {
    if (!newItem.name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    setIsSaving(true);

    const payload = {
        table_id: tableId,
        category,
        name: newItem.name,
        description: newItem.description,
        weight: parseFloat(newItem.weight) || 0,
        data: newItem.data
    };

    try {
        let savedData;
        
        if (editingId) {
            const { data, error } = await supabase
                .from("item_templates")
                .update(payload)
                .eq("id", editingId)
                .select()
                .single();
            
            if (error) throw error;
            savedData = data;

            queryClient.setQueryData(queryKey, (old: ItemTemplate[] | undefined) => {
                return old ? old.map(i => i.id === editingId ? savedData : i) : [savedData];
            });
            
            toast({ title: "Item Atualizado!" });

        } else {
            const { data, error } = await supabase
                .from("item_templates")
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            savedData = data;

            queryClient.setQueryData(queryKey, (old: ItemTemplate[] | undefined) => {
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

  const handleEdit = (item: ItemTemplate) => {
      setEditingId(item.id);
      setNewItem({
          name: item.name,
          description: item.description || "",
          weight: String(item.weight || ""), 
          data: item.data || {}
      });
      setEditorKey(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setNewItem(JSON.parse(JSON.stringify(defaultState)));
      setEditorKey(prev => prev + 1);
  };

  const confirmDelete = async () => {
     if (!itemToDelete) return;
     
     const previousData = queryClient.getQueryData<ItemTemplate[]>(queryKey);
     queryClient.setQueryData(queryKey, (old: ItemTemplate[] | undefined) => {
         return old ? old.filter(i => i.id !== itemToDelete) : [];
     });

     const { error } = await supabase.from("item_templates").delete().eq("id", itemToDelete);
     
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
        case 'quality': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Aplicável em (Arma/Armadura...)" value={newItem.data.targetType || ""} onChange={e => updateData('targetType', e.target.value)} className="bg-background col-span-2"/></div>);
        case 'trait': return (<div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Select value={newItem.data.type || "Traço"} onValueChange={v => updateData('type', v)}><SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="Traço">Traço</SelectItem><SelectItem value="Dádiva">Dádiva</SelectItem><SelectItem value="Fardo">Fardo</SelectItem><SelectItem value="Monstruoso">Traço de Criatura</SelectItem></SelectContent></Select><Input placeholder="Custo / Pontos" value={newItem.data.cost || ""} onChange={e => updateData('cost', e.target.value)} className="bg-background"/></div><div className="space-y-2 border-t pt-2"><Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label><Textarea placeholder="Novato..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.novice || ""} onChange={e => updateData('novice', e.target.value)} /><Textarea placeholder="Adepto..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.adept || ""} onChange={e => updateData('adept', e.target.value)} /><Textarea placeholder="Mestre..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.master || ""} onChange={e => updateData('master', e.target.value)} /></div></div>);
        case 'weapon': { const isReloadable = newItem.data.subcategory === "Arma de Projétil" || newItem.data.subcategory === "Arma de Arremesso"; return (<div className="grid grid-cols-2 gap-3"><Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}><SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Categoria da Arma" /></SelectTrigger><SelectContent>{WEAPON_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select><Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="bg-background"/><Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => updateData('attackAttribute', e.target.value)} className="bg-background"/><Input placeholder="Qualidades (ex: Precisa)" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} className="bg-background"/>{isReloadable && (<Input placeholder="Recarga (ex: Ação Livre)" value={newItem.data.reloadAction || ""} onChange={e => updateData('reloadAction', e.target.value)} className="bg-background col-span-2 md:col-span-1 border-accent/50"/>)}<Input placeholder="Preço (ex: 5 Tálers)" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className={`${isReloadable ? "col-span-2 md:col-span-1" : "col-span-2"} bg-background`}/></div>); }
        case 'armor': return (<div className="grid grid-cols-2 gap-3"><Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}><SelectTrigger className="col-span-2 bg-background"><SelectValue placeholder="Tipo de Armadura" /></SelectTrigger><SelectContent>{ARMOR_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select><Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="bg-background"/><Input placeholder="Penalidade (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="bg-background"/><Input placeholder="Qualidades" className="col-span-2 bg-background" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} /><Input placeholder="Preço" className="col-span-2 bg-background" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} /></div>);
        case 'ability': return (<div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Select value={newItem.data.type || "Habilidade"} onValueChange={v => updateData('type', v)}><SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent></Select><Input placeholder="Custo Corr." value={newItem.data.corruptionCost || ""} onChange={e => updateData('corruptionCost', e.target.value)} className="bg-background"/><Input placeholder="Atributo Assoc." className="bg-background" value={newItem.data.associatedAttribute || ""} onChange={e => updateData('associatedAttribute', e.target.value)} /><Input placeholder="Tradição" value={newItem.data.tradition || ""} onChange={e => updateData('tradition', e.target.value)} className="bg-background"/></div><div className="space-y-2 border-t pt-2"><Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label><Textarea placeholder="Novato..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.novice || ""} onChange={e => updateData('novice', e.target.value)} /><Textarea placeholder="Adepto..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.adept || ""} onChange={e => updateData('adept', e.target.value)} /><Textarea placeholder="Mestre..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.master || ""} onChange={e => updateData('master', e.target.value)} /></div></div>);
        case 'consumable': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
        case 'food': return (<div className="grid grid-cols-2 gap-3"><Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}><SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Tipo de Alimento" /></SelectTrigger><SelectContent>{FOOD_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
        case 'construction': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Integridade" value={newItem.data.integrity || ""} onChange={e => updateData('integrity', e.target.value)} className="bg-background"/><Input placeholder="Resistência" value={newItem.data.resistance || ""} onChange={e => updateData('resistance', e.target.value)} className="bg-background"/><Input placeholder="Preço" className="col-span-2 bg-background" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} /></div>);
        case 'trap': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Dificuldade Detetar" value={newItem.data.spotDifficulty || ""} onChange={e => updateData('spotDifficulty', e.target.value)} className="bg-background"/><Input placeholder="Dificuldade Desarmar" value={newItem.data.disarmDifficulty || ""} onChange={e => updateData('disarmDifficulty', e.target.value)} className="bg-background"/><Input placeholder="Dano / Efeito" className="col-span-2 bg-background" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} /><Input placeholder="Preço" className="col-span-2 bg-background" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} /></div>);
        case 'artifact': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Efeito Mágico" className="col-span-2 bg-background" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} /><Input placeholder="Corrupção" value={newItem.data.corruption || ""} onChange={e => updateData('corruption', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
        default: return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="col-span-2 bg-background"/></div>);
      }
  };

  return (
    <div className="space-y-6">
       <Card className={`border-dashed border-2 transition-colors ${editingId ? "bg-accent/5 border-accent" : "bg-muted/20"}`}>
          <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {editingId ? "Editando Item" : "Novo Item no Database"}
                  </h3>
                  {editingId && <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="w-4 h-4 mr-1"/> Cancelar Edição</Button>}
              </div>
              <div className="grid grid-cols-12 gap-4">
                 <div className="col-span-12 space-y-4">
                     <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8 space-y-2">
                            <Label>Nome</Label>
                            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome..." className="bg-background" />
                        </div>
                        
                        {/* --- ALTERAÇÃO: Serviços removido da lista de exceção de peso pois a categoria foi removida --- */}
                        {category !== 'ability' && category !== 'quality' && category !== 'trait' && category !== 'construction' && (
                            <div className="col-span-4 space-y-2">
                                <Label>Peso</Label>
                                <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} className="bg-background" />
                            </div>
                        )}
                     </div>
                     {renderSpecificFields()}
                 </div>
                 <div className="col-span-12 space-y-2">
                     <Label>Descrição Completa / Regras</Label>
                     <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                        <RichTextEditor 
                            key={`${editingId || 'new'}-${category}-${editorKey}`}
                            value={newItem.description} 
                            onChange={val => setNewItem({...newItem, description: val})} 
                            placeholder="Escreva as regras, efeitos e detalhes aqui..." 
                        />
                     </Suspense>
                 </div>
                 <div className="col-span-12 flex justify-end pt-2">
                     <Button onClick={handleSave} className="w-full sm:w-auto" disabled={isSaving}>
                         {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : (editingId ? <Save className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>)} 
                         {editingId ? "Salvar Alterações" : "Adicionar ao Database"}
                     </Button>
                 </div>
              </div>
          </CardContent>
       </Card>
       
       <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
             placeholder="Pesquisar..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
             className="pl-8 bg-background"
          />
       </div>

       <div className="grid grid-cols-1 gap-2 pb-10">
          {filteredItems.map(item => (
             <div key={item.id} className="flex gap-3 p-3 border rounded-md bg-card hover:bg-accent/50 group cursor-pointer transition-all items-start" onClick={() => handleEdit(item)}>
                <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                        {item.name}
                        {item.data.subcategory && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-primary/10 text-primary border-primary/20">{item.data.subcategory}</span>}
                        {item.data.reloadAction && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-accent/10 text-accent border-accent/20">Recarga: {item.data.reloadAction}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.description?.replace(/<[^>]*>?/gm, '') || "Sem descrição."}
                    </div>
                </div>

                <div className="flex items-center gap-2 self-center">
                    {item.weight > 0 && (
                        <div className="text-xs text-muted-foreground border px-2 py-1 rounded bg-muted/30 whitespace-nowrap">
                             {item.weight} peso
                        </div>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all" onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
             </div>
           ))}
          {filteredItems.length === 0 && <p className="text-center text-muted-foreground py-8 italic">Nenhum item encontrado nesta categoria.</p>}
       </div>
       
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apagar Item?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem a certeza que quer remover este item do banco de dados?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Apagar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}