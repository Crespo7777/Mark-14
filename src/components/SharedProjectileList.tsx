import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDot, Plus, Trash2, Database, Crosshair } from "lucide-react";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { useToast } from "@/hooks/use-toast";

interface SharedProjectileListProps {
  control: Control<any>;
  name: string;
  tableId?: string;
}

export const SharedProjectileList = ({ control, name, tableId }: SharedProjectileListProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  const { toast } = useToast();

  // Adicionar item vindo do Database
  const handleAddFromDatabase = (itemTemplate: any) => {
    if (!itemTemplate) return;
    
    append({
        name: itemTemplate.name,
        amount: 20, // Quantidade padrão
        damage: itemTemplate.data?.damage || "1d6",
        used: false
    });
    
    toast({ title: "Munição Adicionada", description: itemTemplate.name });
  };

  // Adicionar linha vazia manual
  const handleAddManual = () => {
    append({
        name: "Nova Munição",
        amount: 20,
        damage: "1d6",
        used: false
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CircleDot className="w-5 h-5" /> Munição (Projéteis)
        </CardTitle>
        
        <div className="flex gap-2">
            {/* Botão Manual */}
            <Button size="sm" variant="ghost" onClick={handleAddManual} title="Adicionar Manualmente">
                <Plus className="w-4 h-4" />
            </Button>

            {/* Botão Database (Só aparece se tiver tableId) */}
            {tableId && (
                <ItemSelectorDialog
                    tableId={tableId}
                    categories={['ammunition']} // <--- O FILTRO SIMPLES
                    title="Buscar Munição"
                    onSelect={handleAddFromDatabase}
                >
                    <Button size="sm" variant="outline" className="gap-2">
                        <Database className="w-4 h-4" /> Buscar
                    </Button>
                </ItemSelectorDialog>
            )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {fields.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md bg-muted/10">
                <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma munição equipada.</p>
            </div>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 p-2 bg-card border rounded-md group">
            {/* Nome */}
            <div className="flex-1">
                <Input
                    {...control.register(`${name}.${index}.name`)}
                    placeholder="Nome (ex: Flechas)"
                    className="h-8 text-sm font-medium border-transparent focus:border-input bg-transparent px-2"
                />
            </div>

            {/* Dano */}
            <div className="w-24">
                <Input
                    {...control.register(`${name}.${index}.damage`)}
                    placeholder="Dano"
                    className="h-8 text-xs text-center bg-muted/50"
                    title="Dano da Munição"
                />
            </div>

            {/* Quantidade */}
            <div className="flex items-center gap-1 bg-muted rounded-md px-2 h-8">
                <span className="text-[10px] text-muted-foreground">Qtd:</span>
                <Input
                    type="number"
                    {...control.register(`${name}.${index}.amount`)}
                    className="w-12 h-6 text-sm text-center border-none bg-transparent focus-visible:ring-0 p-0"
                />
            </div>

            {/* Remover */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};