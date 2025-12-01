import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices, Brain, BicepsFlexed, Eye, Ghost, Feather, MessageCircle, Crosshair } from "lucide-react";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { AttributeRollDialog } from "@/components/AttributeRollDialog";
import { attributesList } from "../character.constants";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { cn } from "@/lib/utils";

const attrIcons: Record<string, any> = {
  strong: BicepsFlexed,
  quick: Feather,
  resolute: Ghost,
  vigilant: Eye,
  persuasive: MessageCircle,
  cunning: Brain,
  discreet: Ghost,
  precise: Crosshair
};

const attrColors: Record<string, string> = {
  strong: "border-red-500",
  quick: "border-yellow-500",
  resolute: "border-purple-500",
  vigilant: "border-blue-500",
  persuasive: "border-pink-500",
  cunning: "border-emerald-500",
  discreet: "border-slate-500",
  precise: "border-orange-500"
};

export const AttributesTab = () => {
  const { character, isReadOnly } = useCharacterSheet();
  const { control, watch } = useFormContext();
  const [rollData, setRollData] = useState<{ name: string; value: number } | null>(null);
  const { remainingAttributePoints } = useCharacterCalculations(); // Mantido do teu código

  const attributes = watch("attributes");

  const pointsColorClass = remainingAttributePoints < 0 ? "text-destructive" : remainingAttributePoints === 0 ? "text-green-600" : "text-muted-foreground";

  return (
    <div className="h-full flex flex-col space-y-4 p-1">
      
      {/* HEADER DE PONTOS (Estilo RPG) */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium">
            <Dices className="w-4 h-4 text-primary" />
            <span>Distribuição de Atributos</span>
        </div>
        <div className="text-sm font-bold bg-muted px-3 py-1 rounded-full">
            Pontos: <span className={pointsColorClass}>{remainingAttributePoints}</span> / 80
        </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {attributesList.map((attr) => {
          const Icon = attrIcons[attr.key] || Dices;
          const colorClass = attrColors[attr.key] || "border-primary";
          // Lógica robusta para ler valor (número ou objeto)
          const rawVal = attributes?.[attr.key];
          const currentValue = typeof rawVal === 'object' ? Number(rawVal.value) : Number(rawVal) || 0;

          return (
            <Card key={attr.key} className={cn("relative overflow-hidden transition-all hover:shadow-lg border-t-4 bg-card/50", colorClass)}>
              <CardContent className="p-4 flex flex-col items-center gap-3">
                
                <div className="flex items-center gap-2 w-full justify-center border-b pb-2 border-border/10">
                    <Icon className="w-5 h-5 opacity-70" />
                    <span className="font-bold uppercase tracking-wider text-xs text-muted-foreground">{attr.label}</span>
                </div>

                <FormField
                  control={control}
                  name={`attributes.${attr.key}`}
                  render={({ field }) => (
                    <FormItem className="space-y-0 w-full flex justify-center">
                      <FormControl>
                        <Input 
                          type="number" 
                          className="text-5xl font-black text-center h-16 w-24 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none hover:bg-muted/10 transition-colors rounded-md cursor-pointer" 
                          {...field}
                          value={typeof field.value === 'object' ? field.value.value : field.value}
                          onChange={e => {
                             const val = e.target.valueAsNumber;
                             // Se o esquema usar objetos {value, ...}, mantém. Se for número direto, usa número.
                             // Adaptar conforme teu schema:
                             if (typeof field.value === 'object') field.onChange({ ...field.value, value: val });
                             else field.onChange(val);
                          }}
                          readOnly={isReadOnly}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs font-semibold h-7 opacity-80 hover:opacity-100"
                    onClick={() => setRollData({ name: attr.label, value: currentValue })}
                >
                    <Dices className="w-3 h-3 mr-2" /> Testar
                </Button>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {rollData && (
        <AttributeRollDialog 
            open={!!rollData} 
            onOpenChange={(o) => !o && setRollData(null)}
            attributeName={rollData.name}
            attributeValue={rollData.value}
            characterName={character.name}
            tableId={character.table_id}
        />
      )}
    </div>
  );
};