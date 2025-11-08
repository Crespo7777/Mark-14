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

// --- CORREÇÃO (Nomes e Ordem) ---
// A lista agora corresponde exatamente ao que você pediu.
const attributesList: { key: string; label: string }[] = [
  { key: "cunning", label: "Astuto" },
  { key: "quick", label: "Rápido" },
  { key: "discreet", label: "Discreto" },
  { key: "resolute", label: "Resoluto" },
  { key: "persuasive", label: "Persuasivo" },
  { key: "vigilant", label: "Vigilante" },
  { key: "precise", label: "Preciso" },
  { key: "vigorous", label: "Vigoroso" },
];
// --- FIM DA CORREÇÃO ---

export const AttributesTab = () => {
  const { form, isEditing } = useCharacterSheet();

  return (
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
              <FormItem>
                <FormLabel className="text-lg">{attr.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="text-2xl font-bold h-12 text-center"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                    readOnly={!isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
};