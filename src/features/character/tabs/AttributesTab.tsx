// src/features/character/tabs/AttributesTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
import { attributesList } from "../character.constants";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations"; 

// --- 1. TIPO REVERTIDO ---
type SelectedAttribute = {
  name: string;
  value: number;
  // 'obstrutiva' REMOVIDO
};
// --- FIM DA REVERSÃO ---

export const AttributesTab = () => {
  const { form, character } = useCharacterSheet();
  const [selectedAttr, setSelectedAttr] = useState<SelectedAttribute | null>(
    null,
  );

  // --- 2. 'totalObstrutiva' REMOVIDO ---
  const { 
    totalAttributePointsSpent, 
    remainingAttributePoints 
  } = useCharacterCalculations();
  // --- FIM DA REVERSÃO ---

  const handleAttributeClick = (
    attr: SelectedAttribute,
  ) => {
    setSelectedAttr(attr);
  };

  const pointsColorClass =
    remainingAttributePoints < 0
      ? "text-destructive font-bold"
      : remainingAttributePoints === 0
      ? "text-primary font-bold"
      : "text-muted-foreground";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-baseline">
            <CardTitle>Atributos</CardTitle>
            <div className="text-right">
              <span className={cn("text-lg", pointsColorClass)}>
                {remainingAttributePoints}
              </span>
              <span className="text-muted-foreground"> / 80 Pontos</span>
            </div>
          </div>
          <CardDescription className="pt-2">
            Distribua seus 80 pontos iniciais (Máx 15).
            <br />
            <span className="text-amber-500 font-medium">
              Aviso: Pelas regras, apenas um atributo pode começar em 15.
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {attributesList.map((attr) => (
            <FormField
              key={attr.key}
              control={form.control}
              name={`attributes.${attr.key as keyof typeof form.getValues.attributes}`}
              render={({ field }) => (
                <div
                  className={cn(
                    "space-y-2 rounded-lg p-2 transition-colors",
                    "cursor-pointer hover:bg-muted/50",
                  )}
                  // --- 3. 'onClick' REVERTIDO ---
                  onClick={() =>
                    handleAttributeClick({
                      name: attr.label,
                      value: field.value,
                    })
                  }
                  // --- FIM DA REVERSÃO ---
                >
                  <FormItem>
                    <FormLabel className={cn("text-lg", "cursor-pointer")}>
                      {attr.label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-2xl font-bold h-12 text-center"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          ))}
        </CardContent>
      </Card>

      <AttributeRollDialog
        open={!!selectedAttr}
        onOpenChange={(open) => {
          if (!open) setSelectedAttr(null);
        }}
        attributeName={selectedAttr?.name || ""}
        attributeValue={selectedAttr?.value || 0}
        characterName={character.name}
        tableId={character.table_id}
        // --- 4. 'obstructivePenalty' REMOVIDO ---
      />
    </>
  );
};