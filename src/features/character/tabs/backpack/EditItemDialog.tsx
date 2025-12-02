import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { QualitySelector } from "@/components/QualitySelector";
import { ItemIconUploader } from "@/components/ItemIconUploader"; // Importar o novo componente

// Categorias para o Select interno de edição
const INVENTORY_CATEGORIES = [
  { id: 'general', label: 'Geral' },
  { id: 'weapon', label: 'Arma' },
  { id: 'armor', label: 'Armadura' },
  { id: 'consumable', label: 'Elixir/Consumível' },
  { id: 'container', label: 'Recipiente' },
  { id: 'ammunition', label: 'Munição' },
  { id: 'tool', label: 'Ferramenta' },
  { id: 'spec_tool', label: 'Ferramenta Esp.' },
  { id: 'clothing', label: 'Roupa' },
  { id: 'food', label: 'Comida' },
  { id: 'mount', label: 'Montaria' },
  { id: 'animal', label: 'Animal' },
  { id: 'construction', label: 'Construção' },
  { id: 'trap', label: 'Armadilha' },
  { id: 'artifact', label: 'Artefato' },
  { id: 'musical', label: 'Musical' },
  { id: 'asset', label: 'Provento/Tesouro' },
  { id: 'material', label: 'Material' },
];

interface EditItemDialogProps {
    open: boolean;
    onClose: () => void;
    item: any;
    onSave: (item: any) => void;
    tableId: string;
}

export const EditItemDialog = ({ open, onClose, item, onSave, tableId }: EditItemDialogProps) => {
    const [editedItem, setEditedItem] = useState<any>(item);

    useEffect(() => {
        if (item) {
            setEditedItem({ ...item, data: item.data || {} });
        }
    }, [item]);

    if (!editedItem) return null;

    const handleSave = () => {
        onSave(editedItem);
        onClose();
    };

    const updateData = (field: string, value: string) => {
        setEditedItem((prev: any) => ({
            ...prev,
            data: { ...prev.data, [field]: value }
        }));
    };

    // Função para atualizar o URL da imagem
    const handleIconUpdate = (url: string) => {
        setEditedItem((prev: any) => ({ ...prev, icon_url: url }));
    };

    const handleIconRemove = () => {
        setEditedItem((prev: any) => ({ ...prev, icon_url: null }));
    };

    const renderCategorySpecificFields = () => {
        const cat = editedItem.category;

        if (cat === 'weapon') {
            return (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Dano</Label>
                        <Input 
                            placeholder="Ex: 1d8"
                            value={editedItem.data?.damage || ""} 
                            onChange={(e) => updateData('damage', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Atributo</Label>
                        <Input 
                            placeholder="Ex: Vigoroso"
                            value={editedItem.data?.attackAttribute || ""} 
                            onChange={(e) => updateData('attackAttribute', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Qualidade</Label>
                        <div className="col-span-3">
                            <QualitySelector 
                                tableId={tableId}
                                targetType="weapon"
                                value={editedItem.data?.quality || ""}
                                onChange={(val) => updateData('quality', val)}
                            />
                        </div>
                    </div>
                </>
            );
        }

        if (cat === 'armor') {
            return (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Proteção</Label>
                        <Input 
                            placeholder="Ex: 1d4"
                            value={editedItem.data?.protection || ""} 
                            onChange={(e) => updateData('protection', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Penalidade</Label>
                        <Input 
                            type="number"
                            placeholder="Ex: 2"
                            value={editedItem.data?.obstructive || ""} 
                            onChange={(e) => updateData('obstructive', e.target.value)} 
                            className="col-span-3 h-8" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs uppercase text-muted-foreground">Qualidade</Label>
                        <div className="col-span-3">
                            <QualitySelector 
                                tableId={tableId}
                                targetType="armor"
                                value={editedItem.data?.quality || ""}
                                onChange={(val) => updateData('quality', val)}
                            />
                        </div>
                    </div>
                </>
            );
        }

        if (cat === 'consumable') {
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs uppercase text-muted-foreground">Duração</Label>
                    <Input 
                        placeholder="Ex: 1 Cena"
                        value={editedItem.data?.duration || ""} 
                        onChange={(e) => updateData('duration', e.target.value)} 
                        className="col-span-3 h-8" 
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Item</DialogTitle>
                    <DialogDescription>Modifique os detalhes deste item.</DialogDescription>
                </DialogHeader>
                
                {/* Layout Principal: Imagem à Esquerda, Campos à Direita */}
                <div className="flex gap-4 py-2">
                    
                    {/* Coluna da Esquerda: Uploader */}
                    <div className="shrink-0 pt-2">
                        <ItemIconUploader 
                            currentUrl={editedItem.icon_url}
                            onUpload={handleIconUpdate}
                            onRemove={handleIconRemove}
                        />
                    </div>

                    {/* Coluna da Direita: Campos */}
                    <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Nome</Label>
                            <Input 
                                value={editedItem.name} 
                                onChange={(e) => setEditedItem({...editedItem, name: e.target.value})} 
                                className="col-span-3 h-8" 
                            />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tipo</Label>
                            <Select 
                                value={editedItem.category || "general"} 
                                onValueChange={(val) => setEditedItem({...editedItem, category: val})}
                            >
                                <SelectTrigger className="col-span-3 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {INVENTORY_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {renderCategorySpecificFields()}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Qtd.</Label>
                            <Input 
                                type="number" 
                                value={editedItem.quantity} 
                                onChange={(e) => setEditedItem({...editedItem, quantity: Number(e.target.value)})} 
                                className="col-span-3 h-8" 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Peso</Label>
                            <Input 
                                type="number" 
                                value={editedItem.weight} 
                                onChange={(e) => setEditedItem({...editedItem, weight: Number(e.target.value)})} 
                                className="col-span-3 h-8" 
                            />
                        </div>
                    </div>
                </div>

                {/* Descrição em baixo (largura total) */}
                <div className="space-y-1 mt-2">
                    <Label>Descrição</Label>
                    <Textarea 
                        value={editedItem.description || ""} 
                        onChange={(e) => setEditedItem({...editedItem, description: e.target.value})} 
                        className="min-h-[80px]" 
                    />
                </div>

                <DialogFooter>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2"/> Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};