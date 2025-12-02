// src/features/npc/tabs/NpcAttributesTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Dices, StickyNote } from "lucide-react";
import { attributesList } from "@/features/character/character.constants";
import { AttributeRollDialog } from "@/components/AttributeRollDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type RollData = {
  name: string;
  value: number;
};

export const NpcAttributesTab = () => {
  // 1. ADICIONADO: 'npc' desestruturado do contexto para termos acesso ao table_id
  const { form, npc, isReadOnly } = useNpcSheet(); 
  const [rollData, setRollData] = useState<RollData | null>(null);

  const getModifier = (value: number) => {
    const mod = 10 - value; 
    if (mod > 0) return `+${mod}`;
    return `${mod}`;
  };

  const getModifierColor = (value: number) => {
    const mod = 10 - value;
    if (mod > 0) return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (mod < 0) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    return "bg-secondary text-secondary-foreground";
  };

  const handleRoll = (key: string, label: string) => {
    const val = Number(form.getValues(`attributes.${key}.value`)) || 0;
    setRollData({ name: label, value: val });
  };

  return (
    <div className="h-full p-2 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {attributesList.map((attr) => {
          const currentValue = form.watch(`attributes.${attr.key}.value`) || 0;
          const hasNote = !!form.watch(`attributes.${attr.key}.note`);

          return (
            <Card key={attr.key} className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="p-2 pb-1 text-center bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  {attr.label}
                  <FormField
                    control={form.control}
                    name={`attributes.${attr.key}.note`}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-5 w-5 absolute right-2 top-2 ${hasNote ? "text-primary animate-pulse" : "text-muted-foreground/30 hover:text-primary"}`}
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
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-3 flex flex-col items-center gap-3">
                <FormField
                  control={form.control}
                  name={`attributes.${attr.key}.value`}
                  render={({ field }) => (
                    <FormItem className="w-full flex justify-center">
                      <FormControl>
                        <Input
                          type="number"
                          className="text-4xl font-black text-center h-16 w-24 border-0 bg-transparent focus-visible:ring-0 shadow-none p-0"
                          placeholder="10"
                          {...field}
                          readOnly={isReadOnly}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Badge variant="outline" className={`text-xs font-mono px-3 py-1 border ${getModifierColor(currentValue)}`}>
                  Mod: {getModifier(currentValue)}
                </Badge>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full h-8 text-xs gap-2 mt-1"
                  onClick={() => handleRoll(attr.key, attr.label)}
                >
                  <Dices className="w-3.5 h-3.5" />
                  Testar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rollData && (
        <AttributeRollDialog
          open={!!rollData}
          onOpenChange={(open) => !open && setRollData(null)}
          attributeName={rollData.name}
          attributeValue={rollData.value}
          characterName={npc.name} // ADICIONADO: Nome do NPC para o chat
          tableId={npc.table_id}   // 2. CORREÇÃO CRÍTICA: Passando o ID da mesa
        />
      )}
    </div>
  );
};