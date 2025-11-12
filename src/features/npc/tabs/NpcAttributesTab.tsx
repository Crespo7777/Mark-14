// src/features/npc/tabs/NpcAttributesTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext"; // 1. Usa o hook do NPC
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
// 2. Importa a lista de atributos do arquivo de constantes
import { attributesList } from "@/features/character/character.constants";

type SelectedAttribute = {
  name: string;
  value: number;
};

// 3. Nome do componente
export const NpcAttributesTab = () => {
  const { form, npc } = useNpcSheet(); // 4. Usa o hook do NPC e pega o 'npc'
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
          {attributesList.map((attr) => (
            <div
              key={attr.key}
              className={cn(
                "space-y-1 rounded-lg p-2 transition-colors",
                "cursor-pointer hover:bg-muted/50",
              )}
              onClick={() =>
                handleAttributeClick(
                  attr.label,
                  form.getValues(
                    `attributes.${
                      attr.key as keyof typeof form.getValues.attributes
                    }.value`,
                  ),
                )
              }
            >
              {/* Campo Principal (Valor) */}
              <FormField
                control={form.control}
                name={
                  `attributes.${
                    attr.key as keyof typeof form.getValues.attributes
                  }.value` // ATUALIZADO: .value
                }
                render={({ field }) => (
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
                )}
              />

              {/* NOVO CAMPO (Anotação/Modificador) */}
              <FormField
                control={form.control}
                name={
                  `attributes.${
                    attr.key as keyof typeof form.getValues.attributes
                  }.note` // ATUALIZADO: .note
                }
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="text"
                        className="h-8 text-center text-sm text-muted-foreground"
                        placeholder="Mod."
                        {...field}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 5. Passa os dados do NPC para o diálogo de rolagem */}
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