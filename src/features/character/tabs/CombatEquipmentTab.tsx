// src/features/character/tabs/CombatEquipmentTab.tsx

import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray, useFormContext } from "react-hook-form"; // useFormContext
// ... (outros imports mantidos)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Shield, Sword, Heart, Dices } from "lucide-react";
import { getDefaultWeapon, getDefaultArmor } from "../character.schema";
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

// ... (Tipos e DamageHealControl mantidos)
type AttackRollData = {
  weaponName: string;
  attributeName: string;
  attributeValue: number;
  projectileId?: string;
};
type DamageRollData = {
  weaponName: string;
  damageString: string;
};

const DamageHealControl = ({
  label,
  onApply,
}: {
  label: string;
  onApply: (amount: number) => void;
}) => {
  const [amount, setAmount] = useState(0);
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-16 h-9 text-center"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onApply(amount);
          setAmount(0);
        }}
      >
        {label}
      </Button>
    </div>
  );
};

export const CombatEquipmentTab = () => {
  const { form, character } = useCharacterSheet();
  const { getValues } = useFormContext(); // Pegando contexto
  
  // ... (restante da lógica de hooks mantida)
  const {
    toughnessMax,
    painThreshold,
    corruptionThreshold,
    activeBerserk,
    quick,
    totalDefense,
  } = useCharacterCalculations();
  
  const { toast } = useToast();
  const projectiles = form.watch("projectiles");
  const currentToughness = form.watch("toughness.current");

  const [attackRollData, setAttackRollData] = useState<AttackRollData | null>(null);
  const [damageRollData, setDamageRollData] = useState<DamageRollData | null>(null);
  const [isDefenseRollOpen, setIsDefenseRollOpen] = useState(false);
  const [openWeapons, setOpenWeapons] = useState<string[]>([]);
  const [openArmors, setOpenArmors] = useState<string[]>([]);

  const { fields: weaponFields, append: appendWeapon, remove: removeWeapon } = useFieldArray({
    control: form.control,
    name: "weapons",
  });

  const { fields: armorFields, append: appendArmor, remove: removeArmor } = useFieldArray({
    control: form.control,
    name: "armors",
  });
  
  // ... (Handlers mantidos: handleDamage, handleHeal, handleAttackClick, etc.)
  const handleDamage = (amount: number) => {
    const newValue = Math.max(0, currentToughness - amount);
    form.setValue("toughness.current", newValue, { shouldDirty: true });
  };

  const handleHeal = (amount: number) => {
    const newValue = Math.min(toughnessMax, currentToughness + amount);
    form.setValue("toughness.current", newValue, { shouldDirty: true });
  };

  const handleAttackClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === weapon.attackAttribute);
    
    const attributeValue = selectedAttr
      ? allAttributes[selectedAttr.key as keyof typeof allAttributes]
      : 0;
      
    if (attributeValue === 0) {
      toast({ title: "Atributo inválido", description: "Defina o atributo de ataque.", variant: "destructive" });
      return;
    }
    setAttackRollData({
      weaponName: weapon.name || "Arma",
      attributeName: selectedAttr?.label || "N/D",
      attributeValue: attributeValue,
      projectileId: weapon.projectileId,
    });
  };

  const handleDamageClick = (index: number) => {
    const weapon = form.getValues(`weapons.${index}`);
    if (!weapon.damage) {
      toast({ title: "Dano não definido", variant: "destructive" });
      return;
    }
    
    let finalDamageString = weapon.damage;
    if (activeBerserk) {
       finalDamageString += "+1d6";
       toast({ title: "Amoque Ativo!", description: "+1d6 de dano.", variant: "destructive" });
    }

    setDamageRollData({
      weaponName: weapon.name || "Arma",
      damageString: finalDamageString,
    });
  };

  const handleProtectionRoll = async (index: number) => {
    const armor = form.getValues(`armors.${index}`);
    
    let protectionString = armor.protection || "0";
    if (activeBerserk && (activeBerserk.level === 'Adepto' || activeBerserk.level === 'Mestre')) {
       protectionString += "+1d4";
       toast({ title: "Pele de Ferro (Amoque)", description: "+1d4 proteção.", variant: "destructive" });
    }

    const protectionRoll = parseDiceRoll(protectionString);
    if (!protectionRoll) {
      toast({ title: "Erro", description: "Dado inválido.", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    toast({ title: `Proteção: ${armor.name}`, description: `Total: ${protectionRoll.total}` });
    
    await supabase.from("chat_messages").insert({
      table_id: character.table_id,
      user_id: user.id,
      message: formatProtectionRoll(character.name, armor.name, protectionRoll),
      message_type: "roll",
    });
  };


  return (
    <div className="space-y-6">
      {/* ... (Seção de status mantida) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VITALIDADE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="text-red-500" /> Vitalidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="toughness.current"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <FormLabel>Atual</FormLabel>
                    <span className="text-sm text-muted-foreground">Máx: {toughnessMax}</span>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      className="text-2xl font-bold h-12"
                      {...field}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        field.onChange(Math.min(toughnessMax, Math.max(0, val)));
                      }}
                    />
                  </FormControl>
                  <Progress value={(field.value / toughnessMax) * 100} className="h-2" />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2 pt-2">
                <DamageHealControl label="Dano" onApply={handleDamage} />
                <DamageHealControl label="Cura" onApply={handleHeal} />
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                   <span className="text-muted-foreground block">Bônus Vitalidade</span>
                   <FormField
                      control={form.control}
                      name="toughness.bonus"
                      render={({ field }) => (
                        <Input type="number" className="h-8" {...field} onChange={e => field.onChange(parseInt(e.target.value)||0)} />
                      )}
                    />
                </div>
                <div>
                   <span className="text-muted-foreground block">Limiar de Dor: <strong className="text-foreground">{painThreshold}</strong></span>
                   <FormField
                      control={form.control}
                      name="painThresholdBonus"
                      render={({ field }) => (
                        <Input type="number" className="h-8" placeholder="Bônus" {...field} onChange={e => field.onChange(parseInt(e.target.value)||0)} />
                      )}
                    />
                </div>
            </div>
          </CardContent>
        </Card>

        {/* CORRUPÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-purple-500" /> Corrupção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="corruption.temporary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporária</FormLabel>
                  <FormControl>
                    <Input type="number" className="text-2xl font-bold h-12" {...field} onChange={e => field.onChange(parseInt(e.target.value)||0)} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="text-muted-foreground">Limiar:</span>
              <span className="font-medium text-lg">{corruptionThreshold}</span>
            </div>
            <FormField
              control={form.control}
              name="corruption.permanent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permanente</FormLabel>
                  <FormControl>
                    <Input type="number" className="h-9" {...field} onChange={e => field.onChange(parseInt(e.target.value)||0)} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* ARMAS */}
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

          <Accordion
            type="multiple"
            className="space-y-4"
            value={openWeapons}
            onValueChange={setOpenWeapons}
          >
            {weaponFields.map((field, index) => {
              // CORREÇÃO: Usando ID estável
              const stableId = getValues(`weapons.${index}.id`) || field.id;

              return (
              <AccordionItem
                key={stableId}
                value={stableId}
                className="p-3 rounded-md border bg-muted/20"
              >
                {/* ... Conteúdo do Item ... */}
                <div className="flex justify-between items-center w-full gap-2 p-0">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex-1 flex items-center gap-2 sm:gap-4 flex-wrap text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate shrink-0">
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
                              form.watch(`weapons.${index}.attackAttribute`),
                          )?.label || "N/A"}
                        </Badge>
                        {form.watch(`weapons.${index}.projectileId`) && (
                          <Badge
                            variant="destructive"
                            className="px-1.5 py-0.5"
                          >
                            Gasta:{" "}
                            {projectiles.find(
                              (p) =>
                                p.id ===
                                form.watch(`weapons.${index}.projectileId`),
                            )?.name || "N/A"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div
                    className="flex items-center gap-1 pl-2 flex-shrink-0"
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

                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                        name={`weapons.${index}.damage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dano</FormLabel>
                            <FormControl>
                              <Input placeholder="1d8" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`weapons.${index}.projectileId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gasta Projétil (Opcional)</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                value === "none" ? undefined : value,
                              )
                            }
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um projétil..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {projectiles.length > 0 && <Separator />}
                              {projectiles.map((proj) => (
                                <SelectItem key={proj.id} value={proj.id}>
                                  {proj.name} (Qtd: {proj.quantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`weapons.${index}.attribute`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Atributo de Dano</FormLabel>
                            <FormControl>
                              <Input placeholder="Vigoroso" {...field} />
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
                              <Input placeholder="Precisa" {...field} />
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
                          <FormLabel>
                            Descrição das Qualidades (Notas)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Precisa: +1d4 no dano..."
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
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

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
              (Rápido {quick} - Obstrutiva - Carga {activeBerserk ? "- Amoque" : ""})
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

          <Accordion
            type="multiple"
            className="space-y-4"
            value={openArmors}
            onValueChange={setOpenArmors}
          >
            {armorFields.map((field, index) => {
              // CORREÇÃO: Usando ID estável
              const stableId = getValues(`armors.${index}.id`) || field.id;

              return (
              <AccordionItem
                key={stableId}
                value={stableId}
                className="p-3 rounded-md border bg-muted/20"
              >
                {/* ... Conteúdo do Item ... */}
                <div className="flex justify-between items-center w-full gap-2 p-0">
                  <AccordionTrigger className="p-0 hover:no-underline flex-1">
                    <div className="flex-1 flex items-center gap-2 sm:gap-4 flex-wrap text-left">
                      <h4 className="font-semibold text-base text-primary-foreground truncate shrink-0">
                        {form.watch(`armors.${index}.name`) ||
                          "Nova Armadura"}
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0.5"
                        >
                          Prot:{" "}
                          {form.watch(`armors.${index}.protection`) || "0"}
                        </Badge>
                        <Badge variant="outline" className="px-1.5 py-0.5">
                          Obst:{" "}
                          {form.watch(`armors.${index}.obstructive`) || 0}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <div
                    className="flex items-center gap-1 pl-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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

                <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                  <div className="space-y-4">
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
                              <Input
                                type="text"
                                placeholder="1d4"
                                {...field}
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
                                  field.onChange(
                                    parseInt(e.target.value, 10) || 0,
                                  )
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
                          <FormLabel>
                            Descrição das Qualidades (Notas)
                          </FormLabel>
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
                    <FormField
                      control={form.control}
                      name={`armors.${index}.equipped`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="m-0">Equipada</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* ... (RollDialogs mantidos) */}
      {attackRollData && (
        <WeaponAttackDialog
          open={!!attackRollData}
          onOpenChange={(open) => !open && setAttackRollData(null)}
          characterName={character.name}
          tableId={character.table_id}
          {...attackRollData}
          projectileId={attackRollData?.projectileId}
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
    </div>
  );
};