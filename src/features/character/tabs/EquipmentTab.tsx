// src/features/character/tabs/EquipmentTab.tsx

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
import { Checkbox } from "@/components/ui/checkbox"; // 1. Importar Checkbox
import { Plus, Trash2, Shield, Sword } from "lucide-react";
import {
  getDefaultWeapon,
  getDefaultArmor,
} from "../character.schema";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations"; // 2. Importar hook

export const EquipmentTab = () => {
  const { form, isEditing } = useCharacterSheet();
  // 3. Pegar os valores calculados
  const { totalDefense, quick } = useCharacterCalculations();

  // Gerenciador de Array para Armas
  const {
    fields: weaponFields,
    append: appendWeapon,
    remove: removeWeapon,
  } = useFieldArray({
    control: form.control,
    name: "weapons",
  });

  // Gerenciador de Array para Armaduras
  const {
    fields: armorFields,
    append: appendArmor,
    remove: removeArmor,
  } = useFieldArray({
    control: form.control,
    name: "armors",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coluna de Armas (Sem mudanças) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sword /> Armas
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => appendWeapon(getDefaultWeapon())}
            disabled={!isEditing}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Arma
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {weaponFields.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma arma adicionada.
            </p>
          )}
          {weaponFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 rounded-md border bg-muted/20 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  {form.watch(`weapons.${index}.name`) || "Nova Arma"}
                </h4>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeWeapon(index)}
                  disabled={!isEditing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`weapons.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Espada Longa"
                        {...field}
                        readOnly={!isEditing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name={`weapons.${index}.damage`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dano</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1d8"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`weapons.${index}.attribute`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atributo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Vigoroso"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`weapons.${index}.quality`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualidades</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Precisa"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`weapons.${index}.quality_desc`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição das Qualidades (Notas)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Precisa: +1d4 no dano..."
                        {...field}
                        readOnly={!isEditing}
                        className="min-h-[60px] text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Coluna de Armaduras (MODIFICADA) */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield /> Armaduras
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => appendArmor(getDefaultArmor())}
              disabled={!isEditing}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Armadura
            </Button>
          </div>
          {/* 4. MOSTRAR DEFESA TOTAL CALCULADA */}
          <div className="pt-2">
            <span className="text-2xl font-bold">
              Defesa Total: {totalDefense}
            </span>
            <p className="text-xs text-muted-foreground">
              (Rápido {quick} - Obstrutiva Total das armaduras equipadas)
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {armorFields.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma armadura adicionada.
            </p>
          )}
          {armorFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 rounded-md border bg-muted/20 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  {form.watch(`armors.${index}.name`) || "Nova Armadura"}
                </h4>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeArmor(index)}
                  disabled={!isEditing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`armors.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cota de Malha"
                        {...field}
                        readOnly={!isEditing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name={`armors.${index}.protection`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proteção</FormLabel>
                      <FormControl>
                        {/* 5. MUDANÇA: type="text" e placeholder */}
                        <Input
                          type="text"
                          placeholder="1d4"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`armors.${index}.obstructive`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obstrutiva</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="-2"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`armors.${index}.quality`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualidades</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Reforçada"
                          {...field}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`armors.${index}.quality_desc`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição das Qualidades (Notas)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Reforçada: +1 na Proteção..."
                        {...field}
                        readOnly={!isEditing}
                        className="min-h-[60px] text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* 6. NOVO: Checkbox "Equipada" */}
              <FormField
                control={form.control}
                name={`armors.${index}.equipped`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium">
                      Equipada (contabilizar na Defesa)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};