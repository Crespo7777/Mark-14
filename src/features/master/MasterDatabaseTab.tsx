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
import { Plus, Trash2 } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="weapon">Armas</TabsTrigger>
             <TabsTrigger value="armor">Armaduras</TabsTrigger>
             <TabsTrigger value="item">Itens / Munição</TabsTrigger>
             <TabsTrigger value="ability">Habilidades / Traços</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
             <DatabaseCategoryManager tableId={tableId} category={activeCategory as any} />
          </div>
       </Tabs>
    </div>
  );
};

const DatabaseCategoryManager = ({ tableId, category }: { tableId: string, category: 'weapon' | 'armor' | 'item' | 'ability' }) => {
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
        toast({ title: "Item adicionado à Database!" });
        setNewItem({ name: "", description: "", weight: 0, data: {} }); // Reset
        queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
    }
  };

  const handleDelete = async (id: string) => {
     await supabase.from("item_templates").delete().eq("id", id);
     queryClient.invalidateQueries({ queryKey: ['item_templates', tableId, category] });
  };

  // Campos específicos baseados na categoria
  const renderSpecificFields = () => {
      if (category === 'weapon') {
          return (
             <div className="grid grid-cols-2 gap-2">
                 <Input placeholder="Dano (ex: 1d8)" value={newItem.data.damage || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, damage: e.target.value}})} />
                 <Input placeholder="Atributo (ex: Vigoroso)" value={newItem.data.attackAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, attackAttribute: e.target.value}})} />
                 <Input placeholder="Qualidades" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
             </div>
          )
      }
      if (category === 'armor') {
        return (
           <div className="grid grid-cols-2 gap-2">
               <Input placeholder="Proteção (ex: 1d4)" value={newItem.data.protection || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, protection: e.target.value}})} />
               <Input type="number" placeholder="Obstrutiva (ex: 2)" value={newItem.data.obstructive || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, obstructive: parseInt(e.target.value)||0}})} />
               <Input placeholder="Qualidades" className="col-span-2" value={newItem.data.quality || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, quality: e.target.value}})} />
           </div>
        )
      }
      if (category === 'ability') {
        return (
           <div className="grid grid-cols-3 gap-2">
               <Input placeholder="Nível (Novato...)" value={newItem.data.level || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, level: e.target.value}})} />
               <Input placeholder="Tipo (Poder/Traço...)" value={newItem.data.type || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, type: e.target.value}})} />
               <Input placeholder="Custo Corr." value={newItem.data.corruptionCost || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, corruptionCost: e.target.value}})} />
               <Input placeholder="Atributo Assoc." value={newItem.data.associatedAttribute || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, associatedAttribute: e.target.value}})} />
               <Input placeholder="Tradição (Opcional)" className="col-span-2" value={newItem.data.tradition || ""} onChange={e => setNewItem({...newItem, data: {...newItem.data, tradition: e.target.value}})} />
           </div>
        )
      }
      return null; // Item genérico só tem peso
  };

  return (
    <div className="space-y-6">
       {/* CREATE FORM */}
       <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                 <div className="col-span-6 space-y-2">
                     <Label>Nome</Label>
                     <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome..." />
                 </div>
                 {category !== 'ability' && (
                    <div className="col-span-2 space-y-2">
                        <Label>Peso</Label>
                        <Input type="number" value={newItem.weight} onChange={e => setNewItem({...newItem, weight: parseInt(e.target.value)||0})} />
                    </div>
                 )}
                 <div className="col-span-12 space-y-2">
                     {renderSpecificFields()}
                 </div>
                 <div className="col-span-12 space-y-2">
                     <Label>Descrição</Label>
                     <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Descrição..." className="h-20" />
                 </div>
                 <div className="col-span-12">
                     <Button onClick={handleCreate} className="w-full"><Plus className="w-4 h-4 mr-2"/> Adicionar ao Database</Button>
                 </div>
              </div>
          </CardContent>
       </Card>
       
       {/* LIST */}
       <div className="grid grid-cols-1 gap-2">
          {items.map(item => (
             <div key={item.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-accent/50">
                <div>
                    <div className="font-bold flex items-center gap-2">
                        {item.name}
                        {category !== 'ability' && <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 rounded">{item.weight} peso</span>}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          ))}
          {items.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum modelo criado nesta categoria.</p>}
       </div>
    </div>
  );
}