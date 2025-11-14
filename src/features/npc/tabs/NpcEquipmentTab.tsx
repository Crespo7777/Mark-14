// src/features/npc/tabs/NpcEquipmentTab.tsx

import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
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
// import { Textarea } from "@/components/ui/textarea"; // Não usado
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Sword, Dices, Shield } from "lucide-react";
import { getDefaultNpcWeapon } from "../npc.schema";
import { getDefaultNpcArmor } from "../npc.schema";
import { attributesList } from "@/features/character/character.constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog";
import { useToast } from "@/hooks/use-toast";
// import { Separator } from "@/components/ui/separator"; // Não usado
import { cn } from "@/lib/utils";

type AttackRollData = {
  abilityName: string;
  attributeName: string;
  attributeValue: number;
};

export const NpcEquipmentTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet();
  const { toast } = useToast();

  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(
    null,
  );
  
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openArmors, setOpenArmors] = useState<string[]>([]);

  const {
    fields: weaponFields,
    append: appendWeapon,
    remove: removeWeapon,
  } = useFieldArray({
    control: form.control,
    name: "weapons",
  });

  const {
    fields: armorFields,
    append: appendArmor,
    remove: removeArmor,
  } = useFieldArray({
    control: form.control,
    name: "armors",
  });

  const handleAttackClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    const allAttributes = form.getValues("attributes");

    const selectedAttr = attributesList.find(
      (attr) => attr.key === weapon.attackAttribute,
    );

    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes].value
      : 0;

    if (attributeValue === 0 || !selectedAttr) {
      toast({
        title: "Atributo de Ataque não definido",
        description: "Selecione um Atributo de Ataque para esta arma.",
        variant: "destructive",
      });
      return;
    }

    setAttackRollData({
      abilityName: weapon.name || "Ataque com Arma",
      attributeName: selectedAttr.label,
      attributeValue: attributeValue,
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* (Card de Armas e todo o resto... sem alterações) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sword /> Armas
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => appendWeapon(getDefaultNpcWeapon())}
              disabled={isReadOnly}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Arma
            </Button>
          </CardHeader>
          <CardContent>
            {weaponFields.length === 0 && (
              <p className="text-muted-foreground text-center py-12">
                Nenhuma arma adicionada.
              </p>
            )}
            <Accordion
              type="multiple"
              className="space-y-4"
              value={openWeapons}
              onValueChange={setOpenWeapons}
            >
              {weaponFields.map((field, index) => {
                const selectedAttrKey = form.watch(
                  `weapons.${index}.attackAttribute`,
                );
                const allAttributes = form.watch("attributes");
                let mod = 0;
                let modString = "";
                if (selectedAttrKey && allAttributes[selectedAttrKey]) {
                  const value = allAttributes[selectedAttrKey].value || 0;
                  mod = value - 10;
                  modString = mod > 0 ? `(+${mod})` : `(${mod})`;
                }
                
                return (
                  <AccordionItem
                    key={field.id}
                    value={field.id}
                    className="p-3 rounded-md border bg-muted/20"
                  >
                    <div className="flex justify-between items-center w-full p-0">
                      <AccordionTrigger className="p-0 hover:no-underline flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                          <h4 className="font-semibold text-base text-primary-foreground truncate">
                            {form.watch(`weapons.${index}.name`) || "Nova Arma"}
                          </h4>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0.5"
                            >
                              Dano:{" "}
                              {form.watch(`weapons.${index}.damage`) || "N/A"}
                            </Badge>
                            <Badge variant="outline" className="px-1.5 py-0.5">
                              Atq:{" "}
                              {attributesList.find(
                                (a) =>
                                  a.key ===
                                  form.watch(
                                    `weapons.${index}.attackAttribute`,
                                  ),
                              )?.label || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <div
                        className="flex gap-1 pl-2 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAttackClick(index)}
                        >
                          <Dices className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Atacar</span>
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeWeapon(index)}
                          disabled={isReadOnly}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                      <div className="space-y-4">
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
                                  readOnly={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`weapons.${index}.attackAttribute`}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex justify-between items-baseline">
                                  <FormLabel>Atributo de Ataque</FormLabel>
                                  {modString && (
                                    <span
                                      className={cn(
                                        "text-sm font-bold",
                                        mod > 0 && "text-primary",
                                        mod < 0 && "text-destructive",
                                        mod === 0 && "text-muted-foreground",
                                      )}
                                    >
                                      {modString}
                                    </span>
                                  )}
                                </div>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isReadOnly}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {attributesList.map((attr) => (
                                      <SelectItem
                                        key={attr.key}
                                        value={attr.key}
                                      >
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
                            name={`weapons.${index}.damage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dano (Fixo)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="5" 
                                    {...field} 
                                    readOnly={isReadOnly}
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
                                    readOnly={isReadOnly}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* (Card de Armaduras... sem alterações) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield /> Armaduras (Anotação)
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => appendArmor(getDefaultNpcArmor())}
              disabled={isReadOnly}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Armadura
            </Button>
          </CardHeader>
          <CardContent>
            {armorFields.length === 0 && (
              <p className="text-muted-foreground text-center py-12">
                Nenhuma armadura anotada.
              </p>
            )}

            <Accordion
              type="multiple"
              className="space-y-4"
              value={openArmors}
              onValueChange={setOpenArmors}
            >
              {armorFields.map((field, index) => (
                <AccordionItem
                  key={field.id}
                  value={field.id}
                  className="p-3 rounded-md border bg-muted/20"
                >
                  <div className="flex justify-between items-center w-full p-0">
                    <AccordionTrigger className="p-0 hover:no-underline flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                        <h4 className="font-semibold text-base text-primary-foreground truncate">
                          {form.watch(`armors.${index}.name`) ||
                            "Nova Armadura"}
                        </h4>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="px-1.5 py-0.5">
                            Proteção:{" "}
                            {form.watch(`armors.${index}.protection`) || "0"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <div
                      className="flex pl-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeArmor(index)}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`armors.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Cota de Malha" 
                                  {...field} 
                                  readOnly={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`armors.${index}.protection`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Proteção (Fixa)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="3" 
                                  {...field} 
                                  readOnly={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`armors.${index}.quality`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Qualidades</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Reforçada" 
                                  {...field} 
                                  readOnly={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* --- INÍCIO DA CORREÇÃO --- */}
      {attackRollData && (
        <NpcAbilityRollDialog
          open={!!attackRollData}
          onOpenChange={(open) => !open && setAttackRollData(null)}
          {...attackRollData}
          buttonText="Rolar Ataque" // <-- 1. PASSAR O TEXTO CORRETO
        />
      )}
      {/* --- FIM DA CORREÇÃO --- */}
    </>
  );
};