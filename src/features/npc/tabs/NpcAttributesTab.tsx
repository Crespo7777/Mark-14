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
  const { form, npc } = useNpcSheet();
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
          {/* --- INÍCIO DA MODIFICAÇÃO --- */}
          {attributesList.map((attr) => {
            // 1. Definimos o nome do campo de atributo (ex: "attributes.cunning.value")
            const attributeName = `attributes.${
              attr.key as keyof typeof form.getValues.attributes
            }.value`;

            // 2. Usamos 'form.watch' para observar o valor atual desse atributo
            const currentValue = form.watch(attributeName);

            // 3. Calculamos o modificador com base na sua regra
            const modifier = (currentValue || 0) - 10;
            // Formatamos para exibir "+1", "-2", "0", etc.
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
                    form.getValues(attributeName), // Pega o valor atual ao clicar
                  )
                }
              >
                {/* Campo Principal (Valor) - Permanece igual */}
                <FormField
                  control={form.control}
                  name={attributeName}
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

                {/* --- 4. CAMPO DE MODIFICADOR AUTOMÁTICO --- */}
                {/* Removemos o <FormField> que usava "attributes.note".
                  Substituímos por um <Input readOnly /> que exibe o 'modString' calculado.
                */}
                <div>
                  <FormControl>
                    <Input
                      type="text"
                      className={cn(
                        "h-8 text-center text-sm font-bold border-none bg-transparent read-only:cursor-default focus-visible:ring-0 focus-visible:ring-offset-0",
                        // Classes de cor dinâmicas
                        modifier > 0 && "text-primary",
                        modifier < 0 && "text-destructive",
                        modifier === 0 && "text-muted-foreground",
                      )}
                      value={modString}
                      readOnly
                      tabIndex={-1} // Remove do foco (não é interativo)
                      onClick={(e) => e.stopPropagation()}
                    />
                  </FormControl>
                </div>
                {/* --- FIM DA MODIFICAÇÃO --- */}
              </div>
            );
          })}
          {/* --- FIM DO MAP --- */}
        </CardContent>
      </Card>

      {/* O diálogo de rolagem permanece o mesmo */}
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