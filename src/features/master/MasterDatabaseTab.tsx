// src/features/master/MasterDatabaseTab.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ItemTemplate } from "@/types/app-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Sword, Shield, FlaskConical, Backpack, Gem, Sparkles, PawPrint, HandCoins, Zap, Dna, Star, Save, X, Search } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- CATEGORIAS GERAIS ---
const CATEGORIES = [
  { id: 'quality', label: 'Qualidades', icon: Star },
  { id: 'weapon', label: 'Armamentos', icon: Sword },
  { id: 'armor', label: 'Proteção', icon: Shield },
  { id: 'ability', label: 'Habilidades & Poderes', icon: Zap },
  { id: 'trait', label: 'Traços & Dádivas', icon: Dna },
  { id: 'consumable', label: 'Consumíveis', icon: FlaskConical },
  { id: 'mystic', label: 'Místicos', icon: Sparkles },
  { id: 'general', label: 'Geral', icon: Backpack },
  { id: 'mount', label: 'Montarias', icon: PawPrint },
  { id: 'service', label: 'Serviços', icon: HandCoins },
  { id: 'material', label: 'Materiais', icon: Gem },
];

// --- SUBCATEGORIAS ---
const WEAPON_SUBCATEGORIES = [
  "Arma de uma Mão",
  "Arma Curta",
  "Arma Longa",
  "Arma Pesada",
  "Arma de Arremesso",
  "Arma de Projétil",
  "Ataque Desarmado",
  "Escudo",
  "Armas de Cerco"
];

const ARMOR_SUBCATEGORIES = [
  "Leve",
  "Média",
  "Pesada"
];

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
             <div className="flex w-max space-x-4 p-4">
                <TabsList className="flex h-auto bg-transparent space-x-2">
                    {CATEGORIES.map(cat => (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="flex flex-col items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border"
                        >
                            <cat.icon className="w-5 h-5" />
                            {cat.label}
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
  
  const defaultState = { name: "", description: "", weight: "", data: {} };
  const [newItem, setNewItem] = useState<any>(defaultState);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado da Pesquisa
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    cancelEdit();
    setSearchQuery("");
  }, [category]);

  const { data: items = [] } = useQuery({
    queryKey: ['item_templates', tableId, category],
    queryFn: () => fetchTemplates(tableId, category),
  });

  // Filtragem
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

    const payload = {
        table_id: tableId,
        category,
        name: newItem.name,
        description: newItem.description,
        weight: parseFloat(newItem.weight) || 0,
        data: newItem.data
    };

    let error;
    if (editingId) {
        const { error: err } = await supabase.from("item_templates").update(payload).eq("id", editingId);
        error = err;
    } else {
        const { error: err } = await supabase.from("item_templates").insert(payload);
        error = err;
    }
    
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: editingId ? "Item Atualizado!" : "Item Criado!" });
        cancelEdit();
        queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setNewItem(JSON.parse(JSON.stringify(defaultState)));
  };

  const handleDelete = async (id: string) => {
     const { error } = await supabase.from("item_templates").delete().eq("id", id);
     if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
     } else {
        toast({ title: "Item apagado" });
        queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
        if (editingId === id) cancelEdit();
     }
  };

  const updateData = (key: string, value: string) => {
     setNewItem((prev: any) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const renderSpecificFields = () => {
      switch (category) {
        case 'quality':
            return (
               <div className="grid grid-cols-2 gap-3">
                   <Input placeholder="Aplicável em (Arma/Armadura/Criatura)" value={newItem.data.targetType || ""} onChange={e => updateData('targetType', e.target.value)} />
                   <Input placeholder="Efeito Mecânico (Resumo)" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} />
               </div>
            );
        case 'weapon':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                    <SelectTrigger className="col-span-2 md:col-span-1 bg-background">
                        <SelectValue placeholder="Categoria da Arma" />
                    </SelectTrigger>
                    <SelectContent>
                        {WEAPON_SUBCATEGORIES.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>

                 <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="bg-background"/>
                 <Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => updateData('attackAttribute', e.target.value)} className="bg-background"/>
                 <Input placeholder="Qualidades (ex: Precisa)" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} className="bg-background"/>
                 <Input placeholder="Preço (ex: 5 Tálers)" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="col-span-2 bg-background"/>
             </div>
          );
        case 'armor':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Select value={newItem.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                    <SelectTrigger className="col-span-2 bg-background">
                        <SelectValue placeholder="Tipo de Armadura (Peso)" />
                    </SelectTrigger>
                    <SelectContent>
                        {ARMOR_SUBCATEGORIES.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>

                 <Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="bg-background"/>
                 <Input placeholder="Obstrutiva (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="bg-background"/>
                 <Input placeholder="Qualidades" className="col-span-2 bg-background" value={newItem.data.quality || ""} onChange={e => updateData('quality', e.target.value)} />
                 <Input placeholder="Preço" className="col-span-2 bg-background" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} />
             </div>
          );
        case 'ability':
          return (
             <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <Select value={newItem.data.level || "Novato"} onValueChange={v => updateData('level', v)}>
                       <SelectTrigger className="bg-background"><SelectValue placeholder="Nível" /></SelectTrigger>
                       <SelectContent><SelectItem value="Novato">Novato</SelectItem><SelectItem value="Adepto">Adepto</SelectItem><SelectItem value="Mestre">Mestre</SelectItem></SelectContent>
                    </Select>
                    <Select value={newItem.data.type || "Habilidade"} onValueChange={v => updateData('type', v)}>
                       <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                       <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                    </Select>
                    <Input placeholder="Custo Corr. (ex: 1d4)" value={newItem.data.corruptionCost || ""} onChange={e => updateData('corruptionCost', e.target.value)} className="bg-background"/>
                    <Input placeholder="Atributo Assoc." className="col-span-2 bg-background" value={newItem.data.associatedAttribute || ""} onChange={e => updateData('associatedAttribute', e.target.value)} />
                    <Input placeholder="Tradição" value={newItem.data.tradition || ""} onChange={e => updateData('tradition', e.target.value)} className="bg-background"/>
                </div>
                <div className="space-y-2 border-t pt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
                    <Textarea placeholder="Novato..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.novice || ""} onChange={e => updateData('novice', e.target.value)} />
                    <Textarea placeholder="Adepto..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.adept || ""} onChange={e => updateData('adept', e.target.value)} />
                    <Textarea placeholder="Mestre..." className="h-14 min-h-[3.5rem] bg-background" value={newItem.data.master || ""} onChange={e => updateData('master', e.target.value)} />
                </div>
             </div>
          );
        case 'trait':
           return (
              <div className="grid grid-cols-2 gap-3">
                 <Select value={newItem.data.type || "Traço"} onValueChange={v => updateData('type', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Traço">Traço</SelectItem>
                            <SelectItem value="Dádiva">Dádiva</SelectItem>
                            <SelectItem value="Fardo">Fardo</SelectItem>
                            <SelectItem value="Monstruoso">Traço de Criatura</SelectItem>
                        </SelectContent>
                 </Select>
                 <Input placeholder="Custo / Pontos" value={newItem.data.cost || ""} onChange={e => updateData('cost', e.target.value)} className="bg-background"/>
              </div>
           );
        case 'consumable':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Efeito Principal" className="col-span-2 bg-background" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} />
                 <Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="bg-background"/>
                 <Input placeholder="Uso (Beber...)" value={newItem.data.usage || ""} onChange={e => updateData('usage', e.target.value)} className="bg-background"/>
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/>
                 <Input placeholder="Toxicidade" value={newItem.data.toxicity || ""} onChange={e => updateData('toxicity', e.target.value)} className="bg-background"/>
             </div>
           );
        case 'mystic':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Nível de Poder" value={newItem.data.powerLevel || ""} onChange={e => updateData('powerLevel', e.target.value)} className="bg-background"/>
                 <Input placeholder="Corrupção" value={newItem.data.corruption || ""} onChange={e => updateData('corruption', e.target.value)} className="bg-background"/>
                 <Input placeholder="Ativação" value={newItem.data.activation || ""} onChange={e => updateData('activation', e.target.value)} className="bg-background"/>
                 <Input placeholder="Efeito" className="col-span-2 bg-background" value={newItem.data.effect || ""} onChange={e => updateData('effect', e.target.value)} />
             </div>
           );
        default: 
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Função/Tipo" value={newItem.data.function || ""} onChange={e => updateData('function', e.target.value)} className="bg-background"/>
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/>
                 {category === 'mount' && <Input placeholder="Velocidade/Carga" value={newItem.data.speed || ""} onChange={e => updateData('speed', e.target.value)} className="bg-background"/>}
             </div>
          );
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
                 <div className="col-span-8 space-y-2">
                     <Label>Nome</Label>
                     <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome..." className="bg-background" />
                 </div>
                 {category !== 'ability' && category !== 'service' && category !== 'quality' && (
                    <div className="col-span-4 space-y-2">
                        <Label>Peso</Label>
                        <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} className="bg-background" />
                    </div>
                 )}
                 
                 <div className="col-span-12 space-y-2">
                     {renderSpecificFields()}
                 </div>
                 
                 <div className="col-span-12 space-y-2">
                     <Label>Descrição Completa / Regras</Label>
                     <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição detalhada..." className="h-24 bg-background" />
                 </div>
                 
                 <div className="col-span-12 flex justify-end">
                     <Button onClick={handleSave} className="w-full sm:w-auto">
                         {editingId ? <Save className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} 
                         {editingId ? "Salvar Alterações" : "Adicionar"}
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
             <div key={item.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-accent/50 group cursor-pointer transition-all" onClick={() => handleEdit(item)}>
                <div className="flex-1">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                        {item.name}
                        {item.data.subcategory && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-primary/10 text-primary border-primary/20">{item.data.subcategory}</span>}
                        {item.data.targetType && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-muted text-muted-foreground">{item.data.targetType}</span>}
                        {item.data.level && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-muted text-muted-foreground">{item.data.level}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                </div>
                <div className="flex items-center gap-2">
                    {category !== 'ability' && category !== 'quality' && (
                        <div className="text-xs text-muted-foreground border px-2 py-1 rounded bg-muted/30 whitespace-nowrap">
                             {item.weight} peso
                        </div>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
             </div>
           ))}
          {filteredItems.length === 0 && <p className="text-center text-muted-foreground py-8 italic">Nenhum item encontrado.</p>}
       </div>
    </div>
  );
}