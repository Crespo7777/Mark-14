// src/features/character/tabs/EquipmentTab.tsx

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Shield, Sword, Dices } from "lucide-react";
import {
  getDefaultWeapon,
  getDefaultArmor,
} from "../character.schema";
import { useCharacterCalculations } from "../hooks/useCharacterCalculations";
import { attributesList } from "../character.constants";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatProtectionRoll } from "@/lib/dice-parser";
import { WeaponAttackDialog } from "@/components/WeaponAttackDialog";
import { WeaponDamageDialog } from "@/components/WeaponDamageDialog";
import { DefenseRollDialog } from "@/components/DefenseRollDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type AttackRollData = {
  weaponName: string;
  attributeName: string;
  attributeValue: number;
};
type DamageRollData = {
  weaponName: string;
  damageString: string;
};

export const EquipmentTab = () => {
  const { form, character } = useCharacterSheet();
  const { totalDefense, quick } = useCharacterCalculations();
  const { toast } = useToast();

  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(
    null,
  );
  const [damageRollData, setDamageRollData] = useState<DamageRollData | null>(
    null,
  );
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);

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

  // Funções de rolagem (sem alteração)
  const handleAttackClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find(
      (attr) => attr.key === weapon.attackAttribute,
    );
    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes]
      : 0;
    if (attributeValue === 0) {
      toast({
        title: "Atributo de Ataque não definido",
        description: "Selecione um Atributo de Ataque para esta arma.",
        variant: "destructive",
      });
      return;
    }
    setAttackRollData({
      weaponName: weapon.name || "Arma",
      attributeName: selectedAttr?.label || "N/D",
      attributeValue: attributeValue,
    });
  };
  const handleDamageClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    if (!weapon.damage) {
      toast({ title: "Dano não definido", variant: "destructive" });
      return;
    }
    setDamageRollData({
      weaponName: weapon.name || "Arma",
      damageString: weapon.damage,
    });
  };
  const handleProtectionRoll = async (index: number) => {
    const armor = form.getValues(`armors.${index}`);
    const protectionRoll = parseDiceRoll(armor.protection || "0");
    if (!protectionRoll) {
      toast({
        title: "Erro",
        description: `Dado de proteção inválido: ${armor.protection}`,
        variant: "destructive",
      });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    toast({
      title: `Proteção de ${armor.name}`,
      description: `Total: ${protectionRoll.total} Proteção`,
    });
    const chatMessage = formatProtectionRoll(
      character.name,
      armor.name,
      protectionRoll,
    );
    await supabase.from("chat_messages").insert({
      table_id: character.table_id,
      user_id: user.id,
      message: chatMessage,
      message_type: "roll",
    });
  };

  return (
    <>
      {/* --- CORREÇÃO DE LAYOUT PRINCIPAL AQUI --- */}
      {/* Trocado "grid grid-cols-1 lg:grid-cols-2 gap-6" por "space-y-6" */}
      <div className="space-y-6">
        {/* Card de Armas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sword /> Armas
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => appendWeapon(getDefaultWeapon())}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Arma
            </Button>
          </CardHeader>
          <CardContent>
            {weaponFields.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma arma adicionada.
              </p>
            )}
            
            <Accordion type="multiple" className="space-y-4">
              {weaponFields.map((field, index) => (
                <AccordionItem
                  key={field.id}
                  value={field.id}
                  className="p-3 rounded-md border bg-muted/20"
                >
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <div className="flex justify-between items-center w-full gap-2">
                      <div className="flex-1 flex items-center gap-2 sm:gap-4 flex-wrap">
                        <h4 className="font-semibold text-base text-primary-foreground truncate shrink-0">
                          {form.watch(`weapons.${index}.name`) || "Nova Arma"}
                        </h4>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="px-1.5 py-0.5">
                            Dano: {form.watch(`weapons.${index}.damage`) || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0.5">
                            Atq: {attributesList.find(
                              (a) => a.key === form.watch(`weapons.${index}.attackAttribute`)
                            )?.label || "N/A"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDamageClick(index)}
                        >
                          <Dices className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Dano</span>
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeWeapon(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                    <div className="space-y-4">
                      {/* Campos de Edição da Arma */}
                      <FormField
                        control={form.control}
                        name={`weapons.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Espada Longa" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`weapons.${index}.attackAttribute`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atributo de Ataque</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {attributesList.map((attr) => (
                                    <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>
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
                              <FormLabel>Dano</FormLabel>
                              <FormControl><Input placeholder="1d8" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`weapons.${index}.attribute`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atributo de Dano</FormLabel>
                              <FormControl><Input placeholder="Vigoroso" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`weapons.${index}.quality`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualidades</FormLabel>
                              <FormControl><Input placeholder="Precisa" {...field} /></FormControl>
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
                            <FormControl><Textarea placeholder="Precisa: +1d4 no dano..." {...field} className="min-h-[60px] text-sm" /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Card de Armaduras */}
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
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Armadura
              </Button>
            </div>
            
            <div className="pt-4 space-y-2">
              <span className="text-3xl font-bold">
                Defesa Total: {totalDefense}
              </span>
              <p className="text-xs text-muted-foreground">
                (Rápido {quick} - Obstrutiva Total - Penalidade de Carga)
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsDefenseRollOpen(true)}
              >
                <Dices className="w-4 h-4" />
                Rolar Defesa (vs {totalDefense})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {armorFields.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma armadura adicionada.
              </p>
            )}

            <Accordion type="multiple" className="space-y-4">
              {armorFields.map((field, index) => (
                <AccordionItem
                  key={field.id}
                  value={field.id}
                  className="p-3 rounded-md border bg-muted/20"
                >
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <div className="flex justify-between items-center w-full gap-2">
                      <div className="flex-1 flex items-center gap-2 sm:gap-4 flex-wrap">
                        <h4 className="font-semibold text-base text-primary-foreground truncate shrink-0">
                          {form.watch(`armors.${index}.name`) || "Nova Armadura"}
                        </h4>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="px-1.5 py-0.5">
                            Prot: {form.watch(`armors.${index}.protection`) || '0'}
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0.5">
                            Obst: {form.watch(`armors.${index}.obstructive`) || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pl-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2 pr-2">
                          <FormField
                            control={form.control}
                            name={`armors.${index}.equipped`}
                            render={({ field }) => (
                              <FormItem className="flex items-center">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-label="Equipada"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                           <span className="hidden sm:inline text-sm font-medium">Equipada</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleProtectionRoll(index)}
                        >
                          <Dices className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">Rolar</span>
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeArmor(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                    <div className="space-y-4">
                      {/* Campos de Edição da Armadura */}
                      <FormField
                        control={form.control}
                        name={`armors.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Cota de Malha" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`armors.${index}.protection`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proteção</FormLabel>
                              <FormControl>
                                <Input type="text" placeholder="1d4" {...field} />
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
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`armors.${index}.quality`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualidades</FormLabel>
                            <FormControl>
                              <Input placeholder="Reforçada" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
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
                                className="min-h-[60px] text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* --- RENDERIZAÇÃO DOS DIÁLOGOS --- */}
      {attackRollData && (
        <WeaponAttackDialog
          open={!!attackRollData}
          onOpenChange={(open) => !open && setAttackRollData(null)}
          characterName={character.name}
          tableId={character.table_id}
          {...attackRollData}
        />
      )}
      {damageRollData && (
        <WeaponDamageDialog
          open={!!damageRollData}
          onOpenChange={(open) => !open && setDamageRollData(null)}
          characterName={character.name}
          tableId={character.table_id}
          {...damageRollData}
        />
      )}
      <DefenseRollDialog
        open={isDefenseRollOpen}
        onOpenChange={setIsDefenseRollOpen}
        defenseValue={totalDefense}
        characterName={character.name}
        tableId={character.table_id}
      />
    </>
  );
};