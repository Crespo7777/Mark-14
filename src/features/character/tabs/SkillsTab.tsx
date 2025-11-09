// src/features/character/tabs/SkillsTab.tsx

import { useState } from "react"; // Importar useState
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
import { Plus, Trash2, Zap, Dices } from "lucide-react";
import {
  Ability, // Importar o tipo
  getDefaultAbility,
} from "../character.schema";
import { attributesList } from "../character.constants"; // Importar lista de atributos
import { AbilityRollDialog } from "@/components/AbilityRollDialog"; // Importar novo diálogo
import { Separator } from "@/components/ui/separator"; // Importar Separator

// Tipo para os dados da rolagem
type AbilityRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: number;
};

export const SkillsTab = () => {
  const { form, character } = useCharacterSheet();
  const [selectedAbilityRoll, setSelectedAbilityRoll] =
    useState<AbilityRollData | null>(null);

  const {
    fields: abilityFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  // Função para abrir o diálogo de rolagem
  const handleRollClick = (index: number) => {
    const ability = form.getValues(`abilities.${index}`);
    const allAttributes = form.getValues("attributes");
    
    // Encontra o atributo selecionado na lista
    const selectedAttr = attributesList.find(
      (attr) => attr.key === ability.associatedAttribute,
    );

    // Pega o valor do atributo (ex: 13) ou 0 se "Nenhum"
    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes]
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum", // Passa o "label" (ex: "Resoluto")
      attributeValue: attributeValue,
      corruptionCost: ability.corruptionCost || 0,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap /> Habilidades, Poderes & Rituais
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendAbility(getDefaultAbility())}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar
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
              className="p-3 rounded-md border bg-muted/20 space-y-4" // Aumentado space-y
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
                <FormField
                  control={form.control}
                  name={`abilities.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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

              {/* --- NOVOS CAMPOS --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`abilities.${index}.associatedAttribute`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Atributo Associado (para rolagem)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o atributo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Nenhum">Nenhum</SelectItem>
                          <Separator />
                          {attributesList.map((attr) => (
                            <SelectItem key={attr.key} value={attr.key}>
                              {attr.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`abilities.${index}.corruptionCost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Corrupção</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {/* --- FIM DOS NOVOS CAMPOS --- */}

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
                        className="min-h-[80px] text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* --- BOTÃO DE ROLAR --- */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRollClick(index)}
                  disabled={
                    form.watch(`abilities.${index}.associatedAttribute`) === "Nenhum"
                  }
                >
                  <Dices className="w-4 h-4 mr-2" />
                  Rolar Teste
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Renderiza o diálogo de rolagem */}
      {selectedAbilityRoll && (
        <AbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => {
            if (!open) setSelectedAbilityRoll(null);
          }}
          characterName={character.name}
          tableId={character.table_id}
          {...selectedAbilityRoll}
        />
      )}
    </>
  );
};