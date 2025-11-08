// src/features/character/tabs/SkillsTab.tsx

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
import { Plus, Trash2, Zap } from "lucide-react";
import { getDefaultAbility } from "../character.schema";

export const SkillsTab = () => {
  const { form, isEditing } = useCharacterSheet();

  const {
    fields: abilityFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap /> Habilidades, Poderes & Rituais
        </CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => appendAbility(getDefaultAbility())}
          disabled={!isEditing}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Habilidade
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {abilityFields.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Nenhuma habilidade adicionada.
          </p>
        )}
        {abilityFields.map((field, index) => (
          <div
            key={field.id}
            className="p-3 rounded-md border bg-muted/20 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">
                {form.watch(`abilities.${index}.name`) || "Nova Habilidade"}
              </h4>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => removeAbility(index)}
                disabled={!isEditing}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Grid atualizado para 3 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name={`abilities.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da Habilidade / Poder"
                        {...field}
                        readOnly={!isEditing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`abilities.${index}.level`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Novato">Novato</SelectItem>
                        <SelectItem value="Adepto">Adepto</SelectItem>
                        <SelectItem value="Mestre">Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* CAMPO "TIPO" ADICIONADO */}
              <FormField
                control={form.control}
                name={`abilities.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Habilidade">Habilidade</SelectItem>
                        <SelectItem value="Poder">Poder</SelectItem>
                        <SelectItem value="Ritual">Ritual</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`abilities.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Regras)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a habilidade, seus efeitos, custo de corrupção, etc..."
                      {...field}
                      readOnly={!isEditing}
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