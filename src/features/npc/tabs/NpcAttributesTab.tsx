// src/features/npc/tabs/NpcAttributesTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { AttributeRollDialog } from "@/components/AttributeRollDialog";
import { attributesList } from "@/features/character/character.constants";

type SelectedAttribute = {
  name: string;
  value: number;
};

export const NpcAttributesTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet();
  const [selectedAttr, setSelectedAttr] = useState<SelectedAttribute | null>(
    null,
  );

  const handleAttributeClick = (name: string, value: number) => {
    setSelectedAttr({
      name: name,
      value: value,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Atributos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {attributesList.map((attr) => {
            const attributeName = `attributes.${
              attr.key as keyof typeof form.getValues.attributes
            }.value`;
            // Garante número para o cálculo do modificador
            const currentValue = Number(form.watch(attributeName));
            
            const modifier = 10 - (currentValue || 0);
            const modString = modifier > 0 ? `+${modifier}` : `${modifier}`;

            return (
              <div
                key={attr.key}
                className={cn(
                  "space-y-1 rounded-lg p-2 transition-colors",
                  "cursor-pointer hover:bg-muted/50",
                )}
                onClick={() =>
                  handleAttributeClick(
                    attr.label,
                    Number(form.getValues(attributeName)) || 0,
                  )
                }
              >
                <FormField
                  control={form.control}
                  name={attributeName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn("text-lg", "cursor-pointer")}>
                        {attr.label}
                      </FormLabel>
                      <FormControl>
                        {/* CORREÇÃO: Input direto sem parseInt */}
                        <Input
                          type="number"
                          className="text-2xl font-bold h-12 text-center"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          readOnly={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormControl>
                    <Input
                      type="text"
                      className={cn(
                        "h-8 text-center text-sm font-bold border-none bg-transparent read-only:cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
                        modifier > 0 && "text-primary",
                        modifier < 0 && "text-destructive",
                        modifier === 0 && "text-muted-foreground",
                      )}
                      value={modString}
                      readOnly
                      tabIndex={-1} 
                      onClick={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AttributeRollDialog
        open={!!selectedAttr}
        onOpenChange={(open) => {
          if (!open) setSelectedAttr(null);
        }}
        attributeName={selectedAttr?.name || ""}
        attributeValue={selectedAttr?.value || 0}
        characterName={npc.name}
        tableId={npc.table_id}
      />
    </>
  );
};