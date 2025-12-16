import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Heart, 
  Zap, 
  Brain, 
  Plus, 
  Trash2, 
  Sword, 
  Crosshair, 
  Wind, 
  Skull,
  Target
} from "lucide-react";
import { usePathfinderContext } from "../PathfinderContext";
import { useRollContext } from "../context/RollContext";
import { Toggle } from "@/components/ui/toggle";

export const CombatTab = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "strikes" });
  
  // Contextos
  const { acTotal, saves, classDC } = usePathfinderContext();
  const { makeRoll, makeDamageRoll } = useRollContext();

  // --- SUB-COMPONENTE: CARD DE ARMA ---
  const WeaponCard = ({ index, field }: any) => {
      const [isAgile, setIsAgile] = useState(false);

      const name = watch(`strikes.${index}.name`) || "Nova Arma";
      const bonus = Number(watch(`strikes.${index}.bonus`)) || 0;
      const damage = watch(`strikes.${index}.damage`) || "1d4";

      // Penalidade de Ataques Múltiplos (MAP)
      const map2 = isAgile ? -4 : -5;
      const map3 = isAgile ? -8 : -10;

      return (
        <div className="group relative overflow-hidden rounded-xl border-2 border-primary/10 bg-card shadow-sm transition-all hover:border-primary/30">
            {/* Header da Arma */}
            <div className="bg-primary/5 p-3 flex justify-between items-start border-b border-primary/10">
                <div className="flex-1 space-y-1">
                    <Input 
                        {...register(`strikes.${index}.name`)} 
                        className="h-7 text-base font-black bg-transparent border-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 text-primary" 
                        placeholder="Nome da Arma"
                        readOnly={isReadOnly}
                    />
                    <div className="flex items-center gap-2">
                         <Input 
                            {...register(`strikes.${index}.traits`)} 
                            className="h-5 text-[10px] bg-background/50 border-none px-2 rounded-full w-full max-w-[150px] text-muted-foreground" 
                            placeholder="Traços (Cortante, Mágico...)"
                            readOnly={isReadOnly}
                         />
                         {!isReadOnly && (
                            <Toggle 
                                pressed={isAgile} 
                                onPressedChange={setIsAgile} 
                                size="sm"
                                className="h-5 px-2 text-[10px] rounded-full border border-blue-200 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-300 hover:bg-blue-50 text-muted-foreground transition-all gap-1"
                            >
                                <Wind className="w-3 h-3" /> Ágil
                            </Toggle>
                         )}
                    </div>
                </div>
                {!isReadOnly && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 absolute top-2 right-2" 
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                )}
            </div>

            {/* Corpo Tático */}
            <div className="p-3 space-y-4">
                {/* Inputs de Stat */}
                <div className="flex gap-3">
                    <div className="bg-muted/20 rounded p-1.5 flex-1 border border-border/50">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1 text-center">Bônus de Ataque</Label>
                        <Input 
                            type="number" 
                            {...register(`strikes.${index}.bonus`)} 
                            className="h-7 text-center font-black text-lg bg-transparent border-none shadow-none p-0 focus-visible:ring-0" 
                            placeholder="+0" 
                            readOnly={isReadOnly}
                        />
                    </div>
                    <div className="bg-muted/20 rounded p-1.5 flex-[2] border border-border/50">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1 text-center">Dano & Tipo</Label>
                        <Input 
                            {...register(`strikes.${index}.damage`)} 
                            className="h-7 text-center font-mono text-sm font-bold bg-transparent border-none shadow-none p-0 focus-visible:ring-0" 
                            placeholder="1d8+4" 
                            readOnly={isReadOnly}
                        />
                    </div>
                </div>

                {/* Grid de Ações */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Ataque Principal */}
                    <Button 
                        onClick={() => makeRoll(bonus, `${name} (Ataque)`, "attack")}
                        className="col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground h-10 shadow-md border-b-4 border-primary/30 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <div className="flex flex-col items-center leading-none">
                            <span className="font-bold flex items-center gap-1 text-xs"><Crosshair className="w-3 h-3"/> ATACAR</span>
                            <span className="text-[10px] opacity-80 font-mono">+{bonus}</span>
                        </div>
                    </Button>
                    
                    {/* Botão de Dano */}
                    <Button 
                        onClick={() => makeDamageRoll(damage, name)}
                        variant="secondary"
                        className="col-span-2 bg-slate-800 hover:bg-slate-700 text-white h-10 shadow-md border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <div className="flex flex-col items-center leading-none">
                            <span className="font-bold flex items-center gap-1 text-xs"><Skull className="w-3 h-3"/> DANO</span>
                            <span className="text-[10px] opacity-70 font-mono">{damage}</span>
                        </div>
                    </Button>

                    {/* Ataques Múltiplos (MAP) */}
                    <Button 
                        onClick={() => makeRoll(bonus + map2, `${name} (MAP 2)`, "attack")}
                        variant="outline"
                        className="col-span-2 h-8 text-xs border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary text-muted-foreground hover:text-primary"
                    >
                        2º Atq ({map2}) <span className="ml-1 font-mono font-bold">+{bonus + map2}</span>
                    </Button>

                    <Button 
                        onClick={() => makeRoll(bonus + map3, `${name} (MAP 3)`, "attack")}
                        variant="outline"
                        className="col-span-2 h-8 text-xs border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary text-muted-foreground hover:text-primary"
                    >
                        3º Atq ({map3}) <span className="ml-1 font-mono font-bold">+{bonus + map3}</span>
                    </Button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. PAINEL DE DEFESAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Classe de Armadura (Hero Card) */}
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-accent/5">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="w-32 h-32" />
              </div>
              <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Classe de Armadura</h3>
                          <p className="text-[10px] text-muted-foreground/70">10 + Des + Prof + Item</p>
                      </div>
                      <Badge variant="outline" className="font-mono bg-background/50">AC</Badge>
                  </div>
                  
                  <div className="flex items-end gap-4 mt-4">
                      <div className="text-5xl font-black text-primary leading-none tracking-tighter">
                          {acTotal}
                      </div>
                      <div className="flex-1 pb-1">
                           <div className="flex items-center gap-2 bg-background/80 p-1.5 rounded-lg border border-border/50 shadow-sm">
                               <Shield className="w-4 h-4 text-primary" />
                               <div className="flex-1 flex flex-col">
                                   <span className="text-[9px] font-bold uppercase text-muted-foreground">Escudo Levantado?</span>
                                   <div className="flex items-center gap-1">
                                       <span className="text-xs text-primary font-bold">+</span>
                                       <Input 
                                            type="number" 
                                            {...register("ac.shield")} 
                                            className="h-4 w-10 text-xs p-0 border-none bg-transparent font-bold focus-visible:ring-0" 
                                            placeholder="0" 
                                            readOnly={isReadOnly}
                                        />
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* Salvamentos (Interactive Tiles) */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
              {[
                  { label: "Fortitude", val: saves.fortitude, icon: Heart, color: "text-red-600", bg: "bg-red-500/5", border: "border-red-200 hover:border-red-400", desc: "Con" },
                  { label: "Reflexos", val: saves.reflex, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-200 hover:border-amber-400", desc: "Des" },
                  { label: "Vontade", val: saves.will, icon: Brain, color: "text-indigo-600", bg: "bg-indigo-500/5", border: "border-indigo-200 hover:border-indigo-400", desc: "Sab" },
              ].map((save) => (
                  <button 
                    key={save.label}
                    type="button"
                    onClick={() => makeRoll(save.val, `Teste de ${save.label}`, "save")}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 cursor-pointer shadow-sm group ${save.bg} ${save.border}`}
                  >
                      <div className={`mb-2 p-2 rounded-full bg-background shadow-sm ${save.color}`}>
                          <save.icon className="w-5 h-5"/>
                      </div>
                      <span className="text-xs font-bold uppercase text-muted-foreground">{save.label}</span>
                      <span className={`text-3xl font-black ${save.color}`}>
                          {save.val >= 0 ? "+" : ""}{save.val}
                      </span>
                      <span className="absolute top-2 right-2 text-[9px] font-black opacity-30 uppercase">{save.desc}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 2. ARSENAL (ATAQUES) */}
      <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-primary/10">
              <h3 className="text-lg font-black text-primary flex items-center gap-2 uppercase tracking-wide">
                  <Sword className="w-5 h-5" /> Arsenal & Ataques
              </h3>
              {!isReadOnly && (
                  <Button size="sm" onClick={() => append({ name: "Nova Arma", bonus: 0, damage: "1d4" })} className="gap-1 shadow-md">
                      <Plus className="w-4 h-4"/> Equipar Arma
                  </Button>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {fields.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-primary/20 rounded-xl bg-muted/5">
                      <div className="p-4 bg-muted/20 rounded-full mb-3">
                        <Crosshair className="w-8 h-8 opacity-40"/>
                      </div>
                      <p className="font-medium">Nenhuma arma equipada.</p>
                      <p className="text-xs opacity-70">Adicione uma arma para calcular seus ataques.</p>
                  </div>
              )}
              {fields.map((field, index) => (
                  <WeaponCard key={field.id} index={index} field={field} />
              ))}
          </div>
      </div>

      {/* 3. CLASSE DE DIFICULDADE (DC) */}
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted/20 rounded-full border border-primary/10">
            <Target className="w-4 h-4 text-primary"/>
            <span className="text-xs font-bold text-muted-foreground uppercase mr-2">Class DC</span>
            <span className="font-mono font-black text-lg text-primary">{classDC}</span>
        </div>
      </div>
    </div>
  );
};