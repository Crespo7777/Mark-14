import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Settings2, Trash2, Tag } from "lucide-react";
import { FormField, FormLabel, FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QualitySelector } from "@/features/systems/symbaroum/components/QualitySelector";
import { Control, useWatch } from "react-hook-form";

interface NpcArmorCardProps {
  index: number;
  onRemove: () => void;
  tableId: string;
  control: Control<any>;
}

export const NpcArmorCard = ({ index, onRemove, tableId, control }: NpcArmorCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Observando valores para exibição na face do card
  const name = useWatch({ control, name: `armors.${index}.name` });
  const protection = useWatch({ control, name: `armors.${index}.protection` });
  const quality = useWatch({ control, name: `armors.${index}.quality` });

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card to-blue-500/5 border shadow-sm hover:border-blue-500/30 transition-all group">
      <CardContent className="p-3">
        {/* Cabeçalho e Identificação */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            {/* Toggle de Equipado (Ícone da Esquerda) */}
            <FormField
              control={control}
              name={`armors.${index}.equipped`}
              render={({ field }) => (
                <div
                  onClick={() => field.onChange(!field.value)}
                  className={`shrink-0 w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all border ${
                    field.value
                      ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted-foreground/20"
                  }`}
                  title={field.value ? "Equipado" : "Desequipado"}
                >
                  <Shield className={`w-4 h-4 ${field.value ? "fill-current" : ""}`} />
                </div>
              )}
            />

            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm truncate leading-tight">
                {name || "Nova Armadura"}
              </span>
              {quality && (
                <div className="flex mt-1">
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 h-4 gap-1 border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-900/20 max-w-[150px] truncate"
                  >
                    <Tag className="w-2 h-2" /> {quality}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Configurações (Popover) */}
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-xs uppercase text-muted-foreground">
                  Editar Armadura
                </h4>

                {/* Grid de Nome e Redução (Igual às armas) */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <FormField
                      control={control}
                      name={`armors.${index}.name`}
                      render={({ field }) => (
                        <div>
                          <FormLabel className="text-[10px]">Nome</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-7 text-xs" />
                          </FormControl>
                        </div>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={control}
                      name={`armors.${index}.protection`}
                      render={({ field }) => (
                        <div>
                          <FormLabel className="text-[10px]">Redução</FormLabel>
                          <FormControl>
                            <Input 
                                {...field} 
                                className="h-7 text-xs font-mono text-center" 
                                placeholder="" // Removido placeholder "1d4"
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={control}
                  name={`armors.${index}.quality`}
                  render={({ field }) => (
                    <div>
                      <FormLabel className="text-[10px]">Qualidades</FormLabel>
                      <QualitySelector
                        tableId={tableId}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        targetType="armor"
                      />
                    </div>
                  )}
                />

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full h-7 text-xs mt-2"
                  onClick={onRemove}
                >
                  <Trash2 className="w-3 h-3 mr-2" /> Excluir Armadura
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Visor de Redução Centralizado (Estilo Weapon Card) */}
        <div className="flex items-center justify-center py-1 bg-muted/40 rounded border border-border/40">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2">
            Redução:
          </span>
          <span className="text-lg font-black text-foreground tracking-tight">
            {protection || "0"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};