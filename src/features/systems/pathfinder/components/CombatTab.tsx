import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Sword, 
  Crosshair, 
  Skull,
  Target,
  Wind,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { usePathfinderContext } from "../PathfinderContext";
import { useRoll } from "../context/RollContext";
import { WeaponData } from "../pathfinder.schema";
import { Toggle } from "@/components/ui/toggle";

export const CombatTab = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "strikes" });
  
  // Contextos
  const { acTotal, acBreakdown, classDC, mods, combatPenalties, level } = usePathfinderContext();
  const { rollCheck, rollDamage } = useRoll();

  // Dados do Inventário (Automático)
  const weapons = (watch("inventory.weapons") || []) as WeaponData[];
  const equippedWeapons = weapons.filter(w => w.equipped);

  // --- COMPONENTE 1: CARD AUTOMÁTICO (Vem do Inventário) ---
  const AutoWeaponCard = ({ weapon }: { weapon: WeaponData }) => {
      const traitsStr = weapon.traits?.toLowerCase() || "";
      const isAgile = traitsStr.includes("agile");
      const isFinesse = traitsStr.includes("finesse");
      const isRanged = weapon.type === "ranged";

      // Lógica de Cálculo
      const useDex = isRanged || (isFinesse && mods.dex > mods.str);
      const attrMod = useDex ? mods.dex : mods.str;
      
      const category = weapon.category || "simple";
      const proficiencies = watch("proficiencies");
      const rank = proficiencies?.[category] || "U";
      
      const getProfBonus = (r: string) => {
        if(r === "T") return 2 + level;
        if(r === "E") return 4 + level;
        if(r === "M") return 6 + level;
        if(r === "L") return 8 + level;
        return 0;
      };
      
      const profBonus = getProfBonus(rank);
      const itemBonus = Number(weapon.bonus_attack) || 0;
      
      let penalty = 0;
      if (!isRanged && combatPenalties?.prone) penalty += combatPenalties.prone;

      const totalAttack = attrMod + profBonus + itemBonus + penalty;

      const dice = weapon.damage_dice || 1;
      const die = weapon.damage_die || "d4";
      const damageBonus = (Number(weapon.bonus_damage) || 0) + (weapon.type === "melee" ? mods.str : 0);
      const damageStr = `${dice}${die}${damageBonus >= 0 ? '+' : ''}${damageBonus}`;

      const map2 = isAgile ? -4 : -5;
      const map3 = isAgile ? -8 : -10;

      return (
        <div className="group relative overflow-hidden rounded-xl border border-blue-200/50 bg-blue-50/10 dark:bg-blue-900/5 shadow-sm">
            <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500/10 rounded-bl-lg text-[9px] font-bold text-blue-500 uppercase">
                Auto
            </div>
            <div className="p-3 space-y-3">
                <div className="flex justify-between items-start pr-8">
                    <div>
                        <div className="font-black text-lg text-primary">{weapon.name}</div>
                        <div className="text-[10px] text-muted-foreground flex gap-2">
                            <span>{isRanged ? "À Distância" : "Corpo-a-Corpo"}</span>
                            <span>•</span>
                            <span>{weapon.group}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button 
                        onClick={() => rollCheck({ bonus: totalAttack, label: `Ataque ${weapon.name}`, type: "attack", dice: "1d20" })}
                        className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm"
                    >
                        <Crosshair className="w-4 h-4 mr-2"/> {totalAttack >= 0 ? `+${totalAttack}` : totalAttack}
                    </Button>
                    <Button 
                        onClick={() => rollDamage({ formula: damageStr, label: `Dano ${weapon.name}`, type: weapon.damage_type })}
                        variant="secondary"
                        className="flex-1 h-9 font-mono font-bold"
                    >
                        <Skull className="w-4 h-4 mr-2"/> {damageStr}
                    </Button>
                </div>

                {/* Ataques Múltiplos Pequenos */}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => rollCheck({ bonus: totalAttack + map2, label: `Ataque (2º) ${weapon.name}`, type: "attack", dice: "1d20" })}>
                        2º ({map2}) <span className="ml-1 font-bold">{totalAttack + map2}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => rollCheck({ bonus: totalAttack + map3, label: `Ataque (3º) ${weapon.name}`, type: "attack", dice: "1d20" })}>
                        3º ({map3}) <span className="ml-1 font-bold">{totalAttack + map3}</span>
                    </Button>
                </div>
            </div>
        </div>
      );
  };

  // --- COMPONENTE 2: CARD MANUAL (Totalmente Editável) ---
  const ManualStrikeCard = ({ index }: { index: number }) => {
      const [isAgile, setIsAgile] = useState(false);
      
      const name = watch(`strikes.${index}.name`) || "Ataque";
      const bonus = Number(watch(`strikes.${index}.manual_attack_bonus`)) || 0;
      const damage = watch(`strikes.${index}.manual_damage`) || "1d4";

      const map2 = isAgile ? -4 : -5;
      const map3 = isAgile ? -8 : -10;

      return (
        <div className="group relative overflow-hidden rounded-xl border-2 border-dashed border-muted bg-card shadow-sm hover:border-primary/50 transition-all">
            <div className="p-3 space-y-3">
                {/* Linha de Edição */}
                <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                        <Input 
                            {...register(`strikes.${index}.name`)} 
                            placeholder="Nome do Ataque (ex: Garra)" 
                            className="h-8 font-bold border-transparent bg-transparent px-0 hover:bg-muted/20 focus:bg-background focus:border-input focus:px-2 transition-all"
                            readOnly={isReadOnly}
                        />
                        <div className="flex gap-2">
                            <div className="w-20">
                                <Input 
                                    type="number"
                                    {...register(`strikes.${index}.manual_attack_bonus`)} 
                                    placeholder="+0" 
                                    className="h-6 text-xs text-center bg-muted/20 border-transparent"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    {...register(`strikes.${index}.manual_damage`)} 
                                    placeholder="1d4+2 S" 
                                    className="h-6 text-xs text-center bg-muted/20 border-transparent font-mono"
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {!isReadOnly && (
                        <div className="flex flex-col gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:bg-destructive/10" 
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="w-3 h-3"/>
                            </Button>
                            <Toggle 
                                pressed={isAgile} 
                                onPressedChange={setIsAgile} 
                                size="sm" 
                                className="h-6 px-2 text-[9px] data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                            >
                                Agile
                            </Toggle>
                        </div>
                    )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                    <Button 
                        onClick={() => rollCheck({ bonus: bonus, label: `Ataque ${name}`, type: "attack", dice: "1d20" })}
                        className="flex-1 h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                    >
                        <Crosshair className="w-3 h-3 mr-1"/> {bonus >= 0 ? `+${bonus}` : bonus}
                    </Button>
                    <Button 
                        onClick={() => rollDamage({ formula: damage, label: `Dano ${name}`, type: "damage" })}
                        variant="secondary"
                        className="flex-1 h-8 font-mono font-bold text-xs"
                    >
                        <Skull className="w-3 h-3 mr-1"/> Dano
                    </Button>
                </div>
                
                {/* MAP Manual */}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => rollCheck({ bonus: bonus + map2, label: `Ataque (2º) ${name}`, type: "attack", dice: "1d20" })}>
                        2º ({map2})
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => rollCheck({ bonus: bonus + map3, label: `Ataque (3º) ${name}`, type: "attack", dice: "1d20" })}>
                        3º ({map3})
                    </Button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. PAINEL DE DEFESAS (Mantido igual) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-accent/5">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="w-32 h-32" />
              </div>
              <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Classe de Armadura</h3>
                          <p className="text-[10px] text-muted-foreground/70">10 + Dex + Prof + Item</p>
                      </div>
                      <Badge variant="outline" className="font-mono bg-background/50">AC</Badge>
                  </div>
                  
                  <div className="flex items-end gap-4 mt-4">
                      <div className="text-5xl font-black text-primary leading-none tracking-tighter">
                          {acTotal}
                      </div>
                      <div className="flex-1 pb-1">
                           <div className="text-xs text-muted-foreground flex flex-col">
                               <span>Dex Cap: {acBreakdown.dexBonus}</span>
                               <span>Item: +{acBreakdown.itemBonus}</span>
                               {acBreakdown.status !== 0 && <span className="text-red-500">Status: {acBreakdown.status}</span>}
                           </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
               <div className="bg-card border rounded-xl p-4 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                       <div className="bg-primary/10 p-2 rounded-full"><Target className="w-5 h-5 text-primary"/></div>
                       <span className="text-sm font-bold uppercase text-muted-foreground">Class DC</span>
                   </div>
                   <span className="text-2xl font-black text-primary">{classDC}</span>
               </div>
               <div className="bg-muted/10 border-dashed border-2 rounded-xl flex items-center justify-center text-muted-foreground text-xs p-4">
                   Espaço para Reações
               </div>
          </div>
      </div>

      {/* 2. ARSENAL (LAYOUT HÍBRIDO) */}
      <div className="space-y-6">
          
          {/* SEÇÃO A: ARMAS DO INVENTÁRIO (Automáticas) */}
          {equippedWeapons.length > 0 && (
              <div className="space-y-3">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Sword className="w-4 h-4"/> Equipados (Inventário)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {equippedWeapons.map((weapon, index) => (
                          <AutoWeaponCard key={weapon.id || index} weapon={weapon} />
                      ))}
                  </div>
              </div>
          )}

          {/* SEÇÃO B: ATAQUES MANUAIS (Editáveis) */}
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Edit className="w-4 h-4"/> Ataques Manuais / Improvisados
                  </h3>
                  {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={() => append({ name: "Novo Ataque", manual_attack_bonus: 0, manual_damage: "1d4" })} className="h-6 text-xs gap-1">
                          <Plus className="w-3 h-3"/> Adicionar
                      </Button>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.length === 0 && equippedWeapons.length === 0 && (
                      <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                          <p className="text-sm">Nenhum ataque configurado.</p>
                          <p className="text-xs opacity-50">Adicione uma arma no inventário ou crie um ataque manual.</p>
                      </div>
                  )}
                  
                  {fields.map((field, index) => (
                      <ManualStrikeCard key={field.id} index={index} />
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
};