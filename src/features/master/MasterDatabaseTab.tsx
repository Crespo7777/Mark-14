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
// CORREÇÃO AQUI: 'Dna' com maiúscula
import { Plus, Trash2, Sword, Shield, FlaskConical, Backpack, Gem, Sparkles, PawPrint, HandCoins, Zap, Dna } from "lucide-react"; 
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Categorias mapeadas para ícones e nomes
const CATEGORIES = [
  { id: 'weapon', label: 'Armamentos', icon: Sword },
  { id: 'armor', label: 'Proteção', icon: Shield },
  { id: 'ability', label: 'Habilidades & Poderes', icon: Zap },
  { id: 'trait', label: 'Traços & Dádivas', icon: Dna }, // CORREÇÃO AQUI
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
  const [activeCategory, setActiveCategory] = useState("weapon");

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
  const [newItem, setNewItem] = useState<any>({ name: "", description: "", weight: 0, data: {} });

  const { data: items = [] } = useQuery({
    queryKey: ['item_templates', tableId, category],
    queryFn: () => fetchTemplates(tableId, category),
  });

  const handleCreate = async () => {
    if (!newItem.name) return toast({ title: "Nome obrigatório", variant: "destructive" });

    const payload = {
        table_id: tableId,
        category,
        name: newItem.name,
        description: newItem.description,
        weight: parseInt(newItem.weight) || 0,
        data: newItem.data
    };

    const { error } = await supabase.from("item_templates").insert(payload);
    
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: "Adicionado ao Compêndio!" });
        setNewItem({ name: "", description: "", weight: 0, data: {} }); 
        queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
    }
  };

  const handleDelete = async (id: string) => {
     await supabase.from("item_templates").delete().eq("id", id);
     queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
  };

  // CAMPOS DINÂMICOS POR CATEGORIA
  const renderSpecificFields = () => {
      switch (category) {
        case 'weapon':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, damage: e.target.value}})} />
                 <Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, attackAttribute: e.target.value}})} />
                 <Input placeholder="Qualidades (ex: Pesada)" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
                 <Input placeholder="Preço (ex: 5 Tálers)" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
             </div>
          );
        case 'armor':
          return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, protection: e.target.value}})} />
                 <Input type="number" placeholder="Obstrutiva (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, obstructive: parseInt(e.target.value)||0}})} />
                 <Input placeholder="Qualidades" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
             </div>
          );
        case 'consumable':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Efeito (Mecânico)" className="col-span-2" value={newItem.data.effect || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, effect: e.target.value}})} />
                 <Input placeholder="Duração" value={newItem.data.duration || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, duration: e.target.value}})} />
                 <Input placeholder="Uso (Beber, Aplicar)" value={newItem.data.usage || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, usage: e.target.value}})} />
                 <Input placeholder="Preço" value={newItem.data.price || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, price: e.target.value}})} />
                 <Input placeholder="Toxicidade/Corrupção" value={newItem.data.toxicity || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, toxicity: e.target.value}})} />
             </div>
           );
        case 'mystic':
           return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Nível de Poder" value={newItem.data.powerLevel || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, powerLevel: e.target.value}})} />
                 <Input placeholder="Corrupção (ex: 1d4 Temp)" value={newItem.data.corruption || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, corruption: e.target.value}})} />
                 <Input placeholder="Ativação (Ritual, Ação)" value={newItem.data.activation || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, activation: e.target.value}})} />
                 <Input placeholder="Efeito Principal" className="col-span-2" value={newItem.data.effect || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, effect: e.target.value}})} />
             </div>
           );
        case 'ability':
          return (
             <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Select value={newItem.data.type || "Habilidade"} onValueChange={v => setNewItem({...newItem, data: {...newItem.data, type: v}})}>
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Habilidade">Habilidade</SelectItem>
                            <SelectItem value="Poder">Poder</SelectItem>
                            <SelectItem value="Ritual">Ritual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder="Custo Corrupção" value={newItem.data.corruptionCost || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, corruptionCost: e.target.value}})} />
                    <Input placeholder="Atributo Associado" value={newItem.data.associatedAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, associatedAttribute: e.target.value}})} />
                    {newItem.data.type === 'Ritual' && (
                       <div className="grid grid-cols-2 gap-2 col-span-2">
                          <Input placeholder="Tradição" value={newItem.data.tradition || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, tradition: e.target.value}})} />
                          <Input placeholder="Tempo de Execução" value={newItem.data.time || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, time: e.target.value}})} />
                       </div>
                    )}
                </div>
                <div className="space-y-2 border-t pt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
                    <Textarea placeholder="Novato: Efeito..." className="h-16" value={newItem.data.novice || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, novice: e.target.value}})} />
                    <Textarea placeholder="Adepto: Efeito..." className="h-16" value={newItem.data.adept || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, adept: e.target.value}})} />
                    <Textarea placeholder="Mestre: Efeito..." className="h-16" value={newItem.data.master || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, master: e.target.value}})} />
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
        // General, Mount, Service, Material usem defaults
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
       {/* CREATE FORM */}
       <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                 <div className="col-span-8 space-y-2">
                     <Label>Nome</Label>
                     <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome do item..." />
                 </div>
                 {category !== 'ability' && category !== 'service' && (
                    <div className="col-span-4 space-y-2">
                        <Label>Peso</Label>
                        <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)||0})} />
                    </div>
                 )}
                 
                 <div className="col-span-12 space-y-2">
                     {renderSpecificFields()}
                 </div>
                 
                 <div className="col-span-12 space-y-2">
                     <Label>Descrição Completa / Lore</Label>
                     <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição detalhada..." className="h-24" />
                 </div>
                 
                 <div className="col-span-12 flex justify-between items-center">
                     <div className="text-xs text-muted-foreground">Origem: Livro Básico (padrão)</div>
                     <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2"/> Adicionar ao Compêndio</Button>
                 </div>
              </div>
          </CardContent>
       </Card>
       
       {/* LISTA DE ITENS */}
       <div className="grid grid-cols-1 gap-2">
          {items.map(item => (
             <div key={item.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-accent/50 group">
                <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                        {item.name}
                        {item.data.type && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-muted">{item.data.type}</span>}
                        {item.data.price && <span className="text-xs font-normal text-accent border border-accent/30 px-1.5 rounded bg-accent/10">{item.data.price}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                    
                    {/* Detalhes Rápidos */}
                    <div className="flex gap-2 mt-2 text-[10px] uppercase tracking-wider opacity-70">
                        {item.data.damage && <span>Dano: {item.data.damage}</span>}
                        {item.data.protection && <span>Prot: {item.data.protection}</span>}
                        {item.data.effect && <span className="text-purple-400">Efeito: {item.data.effect}</span>}
                        {item.data.corruption && <span className="text-destructive">Corr: {item.data.corruption}</span>}
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          ))}
          {items.length === 0 && <p className="text-center text-muted-foreground py-8 italic">Nenhum item nesta categoria.</p>}
       </div>
    </div>
  );
}