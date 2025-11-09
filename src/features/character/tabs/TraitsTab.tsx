// src/features/character/tabs/TraitsTab.tsx

import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Sparkles } from "lucide-react"; // Ícone diferente
import { getDefaultTrait } from "../character.schema";

export const TraitsTab = () => {
  // ATUALIZADO: isEditing removido
  const { form /*, isEditing*/ } = useCharacterSheet();

  // Gerenciador de Array para Traços
  const {
    fields: traitFields,
    append: appendTrait,
    remove: removeTrait,
  } = useFieldArray({
    control: form.control,
    name: "traits",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles /> Traços, Dádivas & Fardos
        </CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => appendTrait(getDefaultTrait())}
          // disabled={!isEditing} // Removido
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Traço
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {traitFields.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Nenhum traço, dádiva ou fardo adicionado.
          </p>
        )}
        {traitFields.map((field, index) => (
          <div
            key={field.id}
            className="p-3 rounded-md border bg-muted/20 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">
                {form.watch(`traits.${index}.name`) || "Novo Traço"}
              </h4>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => removeTrait(index)}
                // disabled={!isEditing} // Removido
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`traits.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do Traço / Dádiva / Fardo"
                        {...field}
                        // readOnly={!isEditing} // Removido
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`traits.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      // disabled={!isEditing} // Removido
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Traço">Traço</SelectItem>
                        <SelectItem value="Dádiva">Dádiva</SelectItem>
                        <SelectItem value="Fardo">Fardo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`traits.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Regras)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o traço, seus efeitos, etc..."
                      {...field}
                      // readOnly={!isEditing} // Removido
                      className="min-h-[80px] text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};