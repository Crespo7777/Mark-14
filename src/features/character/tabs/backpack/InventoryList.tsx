import { useState } from "react";
import { useCharacterSheet } from "../../CharacterSheetContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { EditItemDialog } from "./EditItemDialog";
import { 
  Package, Plus, Trash2, Sword, Shield, Backpack, Edit, Database, 
  ChevronDown, ChevronUp, Info, Star, Clock 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDefaultWeapon, getDefaultArmor } from "../../character.schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils"; // Utilitário de classes do Shadcn

// Categorias permitidas
const INVENTORY_CATEGORIES_SELECTOR = [
  'general', 'consumable', 'container', 'ammunition', 'tool', 'spec_tool', 
  'clothing', 'food', 'mount', 'animal', 'construction', 'trap', 'artifact', 
  'musical', 'asset', 'material', 'weapon', 'armor'
];

export const InventoryList = () => {
  const { form, character } = useCharacterSheet();
  const { toast } = useToast();
  
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [itemToEquipIndex, setItemToEquipIndex] = useState<number | null>(null);
  
  // Estado para controlar qual item está expandido
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const inventory = (form.watch("inventory") || []) as any[];

  // --- ACTIONS ---

  const handleAddItem = (itemTemplate: any) => {
    const newItem = {
        id: crypto.randomUUID(),
        name: itemTemplate ? itemTemplate.name : "Novo Item",
        category: itemTemplate ? itemTemplate.category : "general",
        weight: itemTemplate ? (Number(itemTemplate.weight) || 0) : 0,
        quantity: 1,
        data: itemTemplate ? (itemTemplate.data || {}) : {},
        description: itemTemplate ? itemTemplate.description : ""
    };

    const currentInv = form.getValues("inventory") || [];
    const newInventory = [...currentInv, newItem];
    
    form.setValue("inventory", newInventory, { shouldDirty: true });
    
    if (itemTemplate) {
        toast({ title: "Item Adicionado", description: `${newItem.name} na mochila.` });
    } else {
        setEditingItemIndex(newInventory.length - 1);
        toast({ title: "Item Criado", description: "Preencha os detalhes do item." });
    }
  };

  const handleAddManual = () => {
      handleAddItem(null);
  };

  const handleRemoveItem = (index: number) => {
    const currentInv = form.getValues("inventory");
    const newInv = currentInv.filter((_, i) => i !== index);
    form.setValue("inventory", newInv, { shouldDirty: true });
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const handleSaveEdit = (updatedItem: any) => {
      if (editingItemIndex === null) return;
      const currentInv = [...inventory];
      currentInv[editingItemIndex] = updatedItem;
      
      form.setValue("inventory", currentInv, { shouldDirty: true });
      toast({ title: "Item Atualizado" });
      
      supabase.from("characters").update({
          data: { ...character.data, inventory: currentInv }
      }).eq("id", character.id).then();
  };

  const toggleExpand = (index: number) => {
      setExpandedIndex(prev => prev === index ? null : index);
  };

  // --- EQUIP LOGIC ---

  const handleEquipClick = (index: number) => {
      const item = inventory[index];
      const category = item.category || item.data?.category;

      if (category === 'weapon') {
          performEquip(index, 'weapon');
      } else if (category === 'armor') {
          performEquip(index, 'armor');
      } else {
          setItemToEquipIndex(index);
          setEquipDialogOpen(true);
      }
  };

  const performEquip = (index: number, type: 'weapon' | 'armor') => {
      const item = inventory[index];
      const currentWeapons = form.getValues("weapons") || [];
      const currentArmors = form.getValues("armors") || [];
      
      if (type === 'weapon' && currentWeapons.length >= 2) {
          toast({ title: "Limite Atingido", description: "Você já tem 2 armas equipadas.", variant: "destructive" });
          setEquipDialogOpen(false);
          return;
      }

      const currentQty = Number(item.quantity);
      if (currentQty > 1) {
          form.setValue(`inventory.${index}.quantity`, currentQty - 1, { shouldDirty: true });
      } else {
          const currentInv = form.getValues("inventory");
          const newInv = currentInv.filter((_, i) => i !== index);
          form.setValue("inventory", newInv, { shouldDirty: true });
          if (expandedIndex === index) setExpandedIndex(null);
      }

      if (type === 'weapon') {
          const newWeapon = {
              ...getDefaultWeapon(),
              name: item.name,
              damage: item.data?.damage || "",
              attribute: item.data?.attackAttribute || item.data?.attribute || "",
              quality: item.data?.quality || "",
              quality_desc: item.description || "",
              weight: Number(item.weight) || 1, 
          };
          form.setValue("weapons", [...currentWeapons, newWeapon], { shouldDirty: true });
          toast({ title: "Arma Equipada!", description: `${item.name} movida para Combate.` });
      } else {
          const newArmor = {
              ...getDefaultArmor(),
              name: item.name,
              protection: item.data?.protection || "",
              obstructive: Number(item.data?.obstructive) || 0,
              quality: item.data?.quality || "",
              quality_desc: item.description || "",
              equipped: true,
              weight: Number(item.weight) || 0,
          };
          form.setValue("armors", [...currentArmors, newArmor], { shouldDirty: true });
          toast({ title: "Armadura Equipada!", description: `${item.name} movida para Combate.` });
      }
      setEquipDialogOpen(false);
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
        weapon: 'Arma', armor: 'Armadura', general: 'Geral', consumable: 'Elixir',
        food: 'Comida', tool: 'Ferramenta', clothing: 'Roupa', musical: 'Instrumento'
    };
    return map[cat] || cat;
  };

  // --- RENDERIZAR DETALHES ---
  const renderItemDetails = (item: any) => {
      const data = item.data || {};
      const hasDetails = item.description || data.damage || data.protection || data.quality || data.duration;

      if (!hasDetails) return <p className="text-xs text-muted-foreground italic px-2">Sem detalhes adicionais.</p>;

      return (
          <div className="space-y-3 px-2">
              {/* Stats Badges */}
              <div className="flex flex-wrap gap-2">
                  {data.damage && (
                      <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/5 gap-1">
                          <Sword className="w-3 h-3"/> Dano: {data.damage}
                      </Badge>
                  )}
                  {data.attackAttribute && (
                      <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                          Atributo: {data.attackAttribute}
                      </Badge>
                  )}
                  {data.protection && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/5 gap-1">
                          <Shield className="w-3 h-3"/> Prot: {data.protection}
                      </Badge>
                  )}
                  {data.obstructive && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5">
                          Penalidade: {data.obstructive}
                      </Badge>
                  )}
                  {data.duration && (
                      <Badge variant="outline" className="border-purple-500/30 text-purple-500 bg-purple-500/5 gap-1">
                          <Clock className="w-3 h-3"/> {data.duration}
                      </Badge>
                  )}
                  {data.quality && (
                      <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20">
                          <Star className="w-3 h-3 fill-current"/> {data.quality}
                      </Badge>
                  )}
              </div>

              {/* Descrição em HTML rico ou texto simples */}
              {item.description && (
                  <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                      <div dangerouslySetInnerHTML={{ __html: item.description }} />
                  </div>
              )}
          </div>
      );
  };

  return (
    <>
      <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                  <Backpack className="w-5 h-5" /> 
                  Mochila & Equipamento
              </CardTitle>
              
              <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleAddManual} title="Criar Item Manualmente">
                      <Plus className="w-4 h-4" />
                  </Button>

                  <ItemSelectorDialog 
                      tableId={character.table_id} 
                      categories={INVENTORY_CATEGORIES_SELECTOR} 
                      title="Adicionar à Mochila"
                      onSelect={handleAddItem}
                  >
                      <Button size="sm" variant="outline" className="border-dashed gap-2">
                          <Database className="w-4 h-4" /> Buscar
                      </Button>
                  </ItemSelectorDialog>
              </div>
          </CardHeader>
          
          <CardContent className="p-0">
              <ScrollArea className="h-[400px] px-4">
                  <div className="space-y-2 pb-4">
                      {inventory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md m-2">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-sm">Mochila vazia.</p>
                          </div>
                      ) : (
                          inventory.map((item: any, index: number) => {
                              const isExpanded = expandedIndex === index;
                              
                              return (
                                  <div 
                                    key={item.id || index} 
                                    className={cn(
                                        "flex flex-col bg-card border rounded-md transition-all duration-200",
                                        isExpanded ? "border-primary/50 shadow-md bg-accent/5" : "hover:border-primary/30"
                                    )}
                                  >
                                      {/* LINHA PRINCIPAL (Clicável para expandir) */}
                                      <div 
                                        className="flex items-center justify-between p-3 cursor-pointer select-none"
                                        onClick={() => toggleExpand(index)}
                                      >
                                          <div className="flex items-center gap-3 overflow-hidden">
                                              {/* Ícone Chevron para indicar expansão */}
                                              <div className="text-muted-foreground">
                                                  {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                              </div>

                                              <div className="bg-muted w-9 h-9 rounded-md flex items-center justify-center shrink-0">
                                                  <Package className="w-4 h-4 opacity-50" />
                                              </div>
                                              <div className="min-w-0">
                                                  <div className="font-medium flex items-center gap-2 truncate text-sm">
                                                      {item.name}
                                                      <Badge variant="secondary" className="text-[10px] h-5 px-1 font-normal">
                                                          x{item.quantity}
                                                      </Badge>
                                                  </div>
                                                  <div className="text-xs text-muted-foreground truncate capitalize">
                                                      {getCategoryLabel(item.category || item.data?.category)}
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Ações (StopPropagation para não fechar o accordion) */}
                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground mr-2">
                                                  {item.weight} peso
                                              </Badge>
                                              
                                              <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                  title="Editar Detalhes"
                                                  onClick={() => setEditingItemIndex(index)}
                                              >
                                                  <Edit className="w-4 h-4" />
                                              </Button>

                                              {(item.category === 'weapon' || item.category === 'armor' || item.data?.category === 'weapon' || item.data?.category === 'armor') && (
                                                  <Button 
                                                      variant="ghost" 
                                                      size="icon" 
                                                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                      title="Equipar"
                                                      onClick={() => handleEquipClick(index)}
                                                  >
                                                      {item.category === 'weapon' || item.data?.category === 'weapon' ? <Sword className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                                  </Button>
                                              )}
                                              
                                              <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => handleRemoveItem(index)}
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </Button>
                                          </div>
                                      </div>

                                      {/* CONTEÚDO EXPANDIDO */}
                                      {isExpanded && (
                                          <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                                              <div className="border-t border-border/50 my-2"></div>
                                              {renderItemDetails(item)}
                                          </div>
                                      )}
                                  </div>
                              );
                          })
                      )}
                  </div>
              </ScrollArea>
          </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Equipar Item</DialogTitle>
                  <DialogDescription>Como deseja equipar este item?</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => itemToEquipIndex !== null && performEquip(itemToEquipIndex, 'armor')}>Como Armadura</Button>
                  <Button onClick={() => itemToEquipIndex !== null && performEquip(itemToEquipIndex, 'weapon')}>Como Arma</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingItemIndex !== null && inventory[editingItemIndex] && (
          <EditItemDialog 
              open={editingItemIndex !== null} 
              onClose={() => setEditingItemIndex(null)} 
              item={inventory[editingItemIndex]} 
              tableId={character.table_id}
              onSave={handleSaveEdit}
          />
      )}
    </>
  );
};