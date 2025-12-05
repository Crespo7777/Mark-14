import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices, Brain, BicepsFlexed, Eye, Ghost, Feather, MessageCircle, Crosshair, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { AttributeRollDialog } from "@/components/AttributeRollDialog";
import { attributesList } from "../character.constants";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Ícones mapeados
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

// Cores mapeadas para os aros dos atributos
const attrColors: Record<string, string> = {
  strong: "text-red-500 border-red-500/30 bg-red-500/5 hover:border-red-500",
  quick: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500",
  resolute: "text-purple-500 border-purple-500/30 bg-purple-500/5 hover:border-purple-500",
  vigilant: "text-blue-500 border-blue-500/30 bg-blue-500/5 hover:border-blue-500",
  persuasive: "text-pink-500 border-pink-500/30 bg-pink-500/5 hover:border-pink-500",
  cunning: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500",
  discreet: "text-slate-500 border-slate-500/30 bg-slate-500/5 hover:border-slate-500",
  precise: "text-orange-500 border-orange-500/30 bg-orange-500/5 hover:border-orange-500"
};

export const AttributesTab = () => {
  const { character, isReadOnly } = useCharacterSheet();
  const { control, watch } = useFormContext();
  const [rollData, setRollData] = useState<{ name: string; value: number } | null>(null);
  const { remainingAttributePoints } = useCharacterCalculations();

  const attributes = watch("attributes");

  // Cores dinâmicas para o contador de pontos
  const pointsStatus = remainingAttributePoints < 0 
    ? { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle, text: "Excesso de Pontos!" } 
    : remainingAttributePoints === 0 
      ? { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2, text: "Distribuição Perfeita" } 
      : { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: Dices, text: "Pontos Disponíveis" };

  const StatusIcon = pointsStatus.icon;

  return (
    <div className="h-full flex flex-col space-y-6 p-2 md:p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER DE PONTOS (VISUAL ATUALIZADO) */}
      <div className={cn("flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all", pointsStatus.bg, pointsStatus.border)}>
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-background border", pointsStatus.border)}>
                <StatusIcon className={cn("w-5 h-5", pointsStatus.color)} />
            </div>
            <div>
                <h4 className={cn("font-bold text-sm uppercase tracking-wide", pointsStatus.color)}>{pointsStatus.text}</h4>
                <p className="text-xs text-muted-foreground">Total para distribuir: 80</p>
            </div>
        </div>
        <div className="text-right">
            <span className={cn("text-3xl font-black tabular-nums tracking-tighter", pointsStatus.color)}>
                {remainingAttributePoints}
            </span>
        </div>
      </div>

      {/* GRID DE ATRIBUTOS (HEXAGONAL/CIRCULAR) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {attributesList.map((attr) => {
          const Icon = attrIcons[attr.key] || Dices;
          const styleClass = attrColors[attr.key] || "text-primary border-primary/30";
          
          const rawVal = attributes?.[attr.key];
          const currentValue = typeof rawVal === 'object' ? Number(rawVal.value) : Number(rawVal) || 0;

          return (
            <div 
                key={attr.key} 
                className={cn(
                    "group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card",
                    styleClass
                )}
            >
              <div className="mb-2 flex flex-col items-center">
                 <Icon className="w-6 h-6 mb-1 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                 <span className="text-xs font-bold uppercase tracking-widest opacity-70">{attr.label}</span>
              </div>

              <FormField
                control={control}
                name={`attributes.${attr.key}`}
                render={({ field }) => (
                  <FormItem className="space-y-0 w-full flex justify-center mb-2">
                    <FormControl>
                      <div className="relative">
                          <Input 
                            type="number" 
                            className="text-4xl md:text-5xl font-black text-center h-16 w-20 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none cursor-pointer" 
                            {...field}
                            value={typeof field.value === 'object' ? field.value.value : field.value}
                            onChange={e => {
                               const val = e.target.valueAsNumber;
                               if (typeof field.value === 'object') field.onChange({ ...field.value, value: val });
                               else field.onChange(val);
                            }}
                            readOnly={isReadOnly}
                          />
                          {/* Efeito de brilho no hover */}
                          <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 rounded-full pointer-events-none transition-opacity" />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full h-8 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-sm"
                            onClick={() => setRollData({ name: attr.label, value: currentValue })}
                        >
                            <Dices className="w-3 h-3 mr-2" /> TESTAR
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Rolar teste de {attr.label}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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