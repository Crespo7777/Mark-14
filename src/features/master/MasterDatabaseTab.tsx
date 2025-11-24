// src/features/master/MasterDatabaseTab.tsx

import { useState } from "react";
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
import { Plus, Trash2, Sword, Shield, FlaskConical, Backpack, Gem, Sparkles, PawPrint, HandCoins, Zap, Dna, Star, Save, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
             <div className="flex w-max space-x-4 p-4">
                <TabsList className="flex h-auto bg-transparent space-x-2">
                    {CATEGORIES.map(cat => (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="flex flex-col items-center gap-2 px-4 py-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground border border-transparent data-[state=active]:border-border"
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
             <DatabaseCategoryManager tableId={tableId} category={activeCategory as any} />
          </div>
       </Tabs>
    </div>
  );
};

const DatabaseCategoryManager = ({ tableId, category }: { tableId: string, category: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // CORREÇÃO: weight inicializado como string ""
  const defaultState = { name: "", description: "", weight: "", data: {} };
  const [newItem, setNewItem] = useState<any>(defaultState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['item_templates', tableId, category],
    queryFn: () => fetchTemplates(tableId, category),
  });

  const handleSave = async () => {
    if (!newItem.name) return toast({ title: "Nome obrigatório", variant: "destructive" });

    const payload = {
        table_id: tableId,
        category,
        name: newItem.name,
        description: newItem.description,
        // CORREÇÃO: Conversão APENAS ao salvar
        weight: parseInt(newItem.weight) || 0,
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
        toast({ title: editingId ? "Atualizado!" : "Criado!" });
        cancelEdit();
        queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
    }
  };

  const handleEdit = (item: ItemTemplate) => {
      setEditingId(item.id);
      setNewItem({
          name: item.name,
          description: item.description || "",
          weight: String(item.weight), // Converte para string ao carregar para edição
          data: item.data || {}
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setNewItem(defaultState);
  };

  const handleDelete = async (id: string) => {
     await supabase.from("item_templates").delete().eq("id", id);
     queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
     if (editingId === id) cancelEdit();
  };

  // CORREÇÃO: Removidos todos os parseInt/Number dos onChanges abaixo
  const renderSpecificFields = () => {
      switch (category) {
        case 'quality':
            return (
               <div className="grid grid-cols-2 gap-3">
                   <Input placeholder="Aplicável em (Arma/Armadura/Criatura)" value={newItem.data.targetType || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, targetType: e.target.value}})} />
                   <Input placeholder="Efeito Mecânico (Resumo)" value={newItem.data.effect || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, effect: e.target.value}})} />
               </div>
            );
        case 'weapon':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, damage: e.target.value}})} />
                 <Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, attackAttribute: e.target.value}})} />
                 <Input placeholder="Qualidades (ex: Precisa)" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
                 <Input placeholder="Preço (ex: 5 Tálers)" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
             </div>
          );
        case 'armor':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, protection: e.target.value}})} />
                 <Input type="number" placeholder="Obstrutiva (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, obstructive: e.target.value}})} />
                 <Input placeholder="Qualidades" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
             </div>
          );
        case 'ability':
          return (
             <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Nível" value={newItem.data.level || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, level: e.target.value}})} />
                    <Input placeholder="Tipo" value={newItem.data.type || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, type: e.target.value}})} />
                    <Input placeholder="Custo Corr." value={newItem.data.corruptionCost || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, corruptionCost: e.target.value}})} />
                    <Input placeholder="Atributo Assoc." className="col-span-2" value={newItem.data.associatedAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, associatedAttribute: e.target.value}})} />
                    <Input placeholder="Tradição" value={newItem.data.tradition || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, tradition: e.target.value}})} />
                </div>
                <div className="space-y-2 border-t pt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
                    <Textarea placeholder="Novato..." className="h-16" value={newItem.data.novice || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, novice: e.target.value}})} />
                    <Textarea placeholder="Adepto..." className="h-16" value={newItem.data.adept || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, adept: e.target.value}})} />
                    <Textarea placeholder="Mestre..." className="h-16" value={newItem.data.master || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, master: e.target.value}})} />
                </div>
             </div>
          );
        case 'trait':
           return (
              <div className="grid grid-cols-2 gap-3">
                 <Select value={newItem.data.type || "Traço"} onValueChange={v => setNewItem({...newItem, data: {...newItem.data, type: v}})}>
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Traço">Traço</SelectItem>
                            <SelectItem value="Dádiva">Dádiva</SelectItem>
                            <SelectItem value="Fardo">Fardo</SelectItem>
                            <SelectItem value="Monstruoso">Traço de Criatura</SelectItem>
                        </SelectContent>
                 </Select>
                 <Input placeholder="Custo / Pontos" value={newItem.data.cost || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, cost: e.target.value}})} />
              </div>
           );
        case 'consumable':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Efeito Principal" className="col-span-2" value={newItem.data.effect || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, effect: e.target.value}})} />
                 <Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, duration: e.target.value}})} />
                 <Input placeholder="Uso (Beber...)" value={newItem.data.usage || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, usage: e.target.value}})} />
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
                 <Input placeholder="Toxicidade" value={newItem.data.toxicity || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, toxicity: e.target.value}})} />
             </div>
           );
        case 'mystic':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Nível de Poder" value={newItem.data.powerLevel || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, powerLevel: e.target.value}})} />
                 <Input placeholder="Corrupção" value={newItem.data.corruption || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, corruption: e.target.value}})} />
                 <Input placeholder="Ativação" value={newItem.data.activation || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, activation: e.target.value}})} />
                 <Input placeholder="Efeito" className="col-span-2" value={newItem.data.effect || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, effect: e.target.value}})} />
             </div>
           );
        default: 
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Função/Tipo" value={newItem.data.function || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, function: e.target.value}})} />
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
                 {category === 'mount' && <Input placeholder="Velocidade/Carga" value={newItem.data.speed || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, speed: e.target.value}})} />}
             </div>
          );
      }
  };

  return (
    <div className="space-y-6">
       <Card className={`border-dashed border-2 ${editingId ? "bg-accent/10 border-accent" : "bg-muted/20"}`}>
          <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {editingId ? "Editando" : "Novo Registo"}
                  </h3>
                  {editingId && <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="w-4 h-4 mr-1"/> Cancelar</Button>}
              </div>

              <div className="grid grid-cols-12 gap-4">
                 <div className="col-span-8 space-y-2">
                     <Label>Nome</Label>
                     <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome do item..." />
                 </div>
                 {category !== 'ability' && category !== 'service' && category !== 'quality' && (
                    <div className="col-span-4 space-y-2">
                        <Label>Peso</Label>
                        <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: e.target.value})} />
                    </div>
                 )}
                 
                 <div className="col-span-12 space-y-2">
                     {renderSpecificFields()}
                 </div>
                 
                 <div className="col-span-12 space-y-2">
                     <Label>Descrição Completa / Regras</Label>
                     <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição detalhada..." className="h-24" />
                 </div>
                 
                 <div className="col-span-12 flex justify-end">
                     <Button onClick={handleSave}>
                         {editingId ? <Save className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} 
                         {editingId ? "Atualizar" : "Adicionar ao Database"}
                     </Button>
                 </div>
              </div>
          </CardContent>
       </Card>
       
       <div className="grid grid-cols-1 gap-2">
          {items.map(item => (
             <div key={item.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-accent/50 group cursor-pointer" onClick={() => handleEdit(item)}>
                <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                        {item.name}
                        {item.data.targetType && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-muted">{item.data.targetType}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          ))}
          {items.length === 0 && <p className="text-center text-muted-foreground py-8 italic">Nenhum item nesta categoria.</p>}
       </div>
    </div>
  );
}