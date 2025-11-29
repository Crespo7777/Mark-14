import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDot, Plus, Trash2, Database, Crosshair } from "lucide-react";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { useToast } from "@/hooks/use-toast";

interface ProjectileListProps {
  control: Control<any>;
  tableId?: string;
}

export const ProjectileList = ({ control, tableId }: ProjectileListProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projectiles",
  });
  const { toast } = useToast();

  // Função para adicionar manual
  const handleAddManual = () => {
    append({
        name: "Nova Munição",
        amount: 20,
        damage: "1d6", 
        weight: 0,
        used: false
    });
  };

  const handleAddFromDatabase = (itemTemplate: any) => {
    // CORREÇÃO: Se o usuário clicar em "Criar Customizado (Vazio)" no dialog,
    // o itemTemplate vem como null. Neste caso, chamamos o manual.
    if (!itemTemplate) {
        handleAddManual();
        return;
    }
    
    append({
        name: itemTemplate.name,
        amount: 20,
        damage: itemTemplate.data?.damage || "1d6",
        weight: Number(itemTemplate.weight) || 0,
        used: false
    });
    
    toast({ title: "Munição Adicionada", description: itemTemplate.name });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CircleDot className="w-5 h-5" /> Munição (Projéteis)
        </CardTitle>
        
        <div className="flex gap-2">
            {/* Botão Manual Direto */}
            <Button size="sm" variant="ghost" onClick={handleAddManual} title="Adicionar Manualmente">
                <Plus className="w-4 h-4" />
            </Button>

            {/* Botão Database */}
            {tableId && (
                <ItemSelectorDialog
                    tableId={tableId}
                    categories={['ammunition']}
                    title="Buscar Munição"
                    onSelect={handleAddFromDatabase}
                >
                    <Button size="sm" variant="outline" className="gap-2 border-dashed">
                        <Database className="w-4 h-4" /> Banco de Dados
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
          <div key={field.id} className="flex items-center gap-2 p-2 bg-card border rounded-md group hover:border-primary/40 transition-colors">
            
            {/* Nome */}
            <div className="flex-1 min-w-[120px]">
                <Input
                    {...control.register(`projectiles.${index}.name`)}
                    placeholder="Nome (ex: Flechas)"
                    className="h-8 text-sm font-medium border-transparent focus:border-input bg-transparent px-2"
                />
            </div>

            {/* Dano */}
            <div className="w-24 relative">
                <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground pointer-events-none">DMG</span>
                <Input
                    {...control.register(`projectiles.${index}.damage`)}
                    placeholder="+0"
                    className="h-8 text-xs text-center pl-8 bg-muted/30 focus:bg-background"
                    title="Dano Adicional (Ex: +3 ou 1d4)"
                />
            </div>

            {/* Peso */}
            <div className="w-16 relative">
                <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground pointer-events-none">kg</span>
                <Input
                    type="number"
                    step="0.1"
                    {...control.register(`projectiles.${index}.weight`)}
                    className="h-8 text-xs text-center bg-muted/30 focus:bg-background pr-5"
                    placeholder="0"
                    title="Peso"
                />
            </div>

            {/* Quantidade */}
            <div className="flex items-center gap-1 bg-muted rounded-md px-2 h-8 shrink-0">
                <span className="text-[10px] text-muted-foreground">Qtd:</span>
                <Input
                    type="number"
                    {...control.register(`projectiles.${index}.amount`)}
                    className="w-12 h-6 text-sm text-center border-none bg-transparent focus-visible:ring-0 p-0 shadow-none"
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