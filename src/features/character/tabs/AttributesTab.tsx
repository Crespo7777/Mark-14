// src/features/character/tabs/AttributesTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
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
import { attributesList } from "../character.constants"; // ATUALIZADO: Importar de constantes

type SelectedAttribute = {
  name: string;
  value: number;
};

export const AttributesTab = () => {
  const { form, character } = useCharacterSheet();
  const [selectedAttr, setSelectedAttr] = useState<SelectedAttribute | null>(
    null,
  );

  const handleAttributeClick = (
    attr: { name: string; value: number },
  ) => {
    setSelectedAttr(attr);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Atributos</CardTitle>
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
                  onClick={() =>
                    handleAttributeClick({
                      name: attr.label,
                      value: field.value,
                    })
                  }
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
      />
    </>
  );
};