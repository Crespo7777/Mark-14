import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices, Brain, BicepsFlexed, Eye, Ghost, Feather, MessageCircle, Crosshair, StickyNote } from "lucide-react";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { AttributeRollDialog } from "@/components/AttributeRollDialog";
import { attributesList } from "@/features/character/character.constants";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

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
  strong: "text-red-500 border-red-500/30 bg-red-500/5 hover:border-red-500",
  quick: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500",
  resolute: "text-purple-500 border-purple-500/30 bg-purple-500/5 hover:border-purple-500",
  vigilant: "text-blue-500 border-blue-500/30 bg-blue-500/5 hover:border-blue-500",
  persuasive: "text-pink-500 border-pink-500/30 bg-pink-500/5 hover:border-pink-500",
  cunning: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500",
  discreet: "text-slate-500 border-slate-500/30 bg-slate-500/5 hover:border-slate-500",
  precise: "text-orange-500 border-orange-500/30 bg-orange-500/5 hover:border-orange-500"
};

export const NpcAttributesTab = () => {
  const { npc, isReadOnly } = useNpcSheet();
  const { control, watch } = useFormContext();
  const [rollData, setRollData] = useState<{ name: string; value: number } | null>(null);

  // Observa todos os atributos para reatividade
  const attributes = watch("attributes");

  // Calcula o modificador (Symbaroum: 10 - Atributo)
  const getModifier = (value: number) => {
    const mod = 10 - value; 
    if (mod > 0) return `+${mod}`;
    return `${mod}`;
  };

  // Cores para o modificador (Invertido: Mod negativo é "Forte" para o NPC)
  const getModifierStyle = (value: number) => {
    const mod = 10 - value;
    if (mod < 0) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"; // Dificil
    if (mod > 0) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"; // Facil
    return "bg-secondary text-muted-foreground border-border"; // Neutro
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-2 md:p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {attributesList.map((attr) => {
          const Icon = attrIcons[attr.key] || Dices;
          const styleClass = attrColors[attr.key] || "text-primary border-primary/30";
          
          // Leitura segura do valor
          const attrObj = attributes?.[attr.key] || {};
          const currentValue = Number(attrObj.value) || 0;
          const hasNote = !!attrObj.note;

          return (
            <div 
                key={attr.key} 
                className={cn(
                    "group relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card min-h-[140px]",
                    styleClass
                )}
            >
              {/* Cabeçalho do Card: Ícone e Nome */}
              <div className="w-full flex justify-between items-start">
                  <div className="flex flex-col items-center w-full">
                     <Icon className="w-5 h-5 mb-1 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{attr.label}</span>
                  </div>

                  {/* Botão de Notas (Discreto no canto) */}
                  <FormField
                    control={control}
                    name={`attributes.${attr.key}.note`}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-5 w-5 absolute right-2 top-2", hasNote ? "text-primary animate-pulse" : "text-muted-foreground/20 hover:text-primary")}
                          >
                            <StickyNote className="w-3 h-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="end">
                          <div className="space-y-2">
                            <h4 className="font-medium text-xs text-muted-foreground mb-1">Notas para {attr.label}</h4>
                            <Textarea 
                                placeholder="Ex: Vantagem em testes de..." 
                                className="text-xs min-h-[80px] resize-none" 
                                {...field}
                                readOnly={isReadOnly}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
              </div>

              {/* Valor Principal (Input) */}
              <FormField
                control={control}
                name={`attributes.${attr.key}.value`}
                render={({ field }) => (
                  <FormItem className="space-y-0 w-full flex justify-center my-1">
                    <FormControl>
                      <div className="relative">
                          <Input 
                            type="number" 
                            className="text-4xl font-black text-center h-12 w-20 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none cursor-pointer z-10 relative" 
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                            readOnly={isReadOnly}
                          />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* MODIFICADOR (O Grande Destaque para o Mestre) */}
              <div className={cn("px-3 py-0.5 rounded-full border text-sm font-mono font-bold shadow-sm mb-1", getModifierStyle(currentValue))}>
                  {getModifier(currentValue)}
              </div>

              {/* Botão de Testar (Hover) */}
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full h-7 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-sm"
                            onClick={() => setRollData({ name: attr.label, value: currentValue })}
                        >
                            <Dices className="w-3 h-3 mr-1.5" /> TESTAR
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
            characterName={npc.name}
            tableId={npc.table_id}
        />
      )}
    </div>
  );
};