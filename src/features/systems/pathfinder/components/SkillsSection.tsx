import { useFormContext, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Book, Dices, ShieldAlert } from "lucide-react";
import { usePathfinderContext } from "../PathfinderContext";
import { useRoll } from "../context/RollContext";

const SKILLS = [
  { key: "acrobatics", label: "Acrobatics", attr: "Dex", armor: true },
  { key: "arcana", label: "Arcana", attr: "Int", armor: false },
  { key: "athletics", label: "Athletics", attr: "Str", armor: true },
  { key: "crafting", label: "Crafting", attr: "Int", armor: false },
  { key: "deception", label: "Deception", attr: "Cha", armor: false },
  { key: "diplomacy", label: "Diplomacy", attr: "Cha", armor: false },
  { key: "intimidation", label: "Intimidation", attr: "Cha", armor: false },
  { key: "medicine", label: "Medicine", attr: "Wis", armor: false },
  { key: "nature", label: "Nature", attr: "Wis", armor: false },
  { key: "occultism", label: "Occultism", attr: "Int", armor: false },
  { key: "performance", label: "Performance", attr: "Cha", armor: false },
  { key: "religion", label: "Religion", attr: "Wis", armor: false },
  { key: "society", label: "Society", attr: "Int", armor: false },
  { key: "stealth", label: "Stealth", attr: "Dex", armor: true },
  { key: "survival", label: "Survival", attr: "Wis", armor: false },
  { key: "thievery", label: "Thievery", attr: "Dex", armor: true },
] as const;

export const SkillsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, setValue, watch, control } = useFormContext();
  const { skills, lores } = usePathfinderContext();
  const { fields, append, remove } = useFieldArray({ control, name: "lores" });
  const { rollCheck } = useRoll();

  const getRankStyle = (rank: string) => {
      switch(rank) {
          case 'T': return "text-green-700 bg-green-100 border-green-200";
          case 'E': return "text-blue-700 bg-blue-100 border-blue-200";
          case 'M': return "text-purple-700 bg-purple-100 border-purple-200";
          case 'L': return "text-orange-700 bg-orange-100 border-orange-200";
          default: return "text-muted-foreground bg-muted border-transparent opacity-50";
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. PERÍCIAS PRINCIPAIS */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-primary/10">
              <Dices className="w-5 h-5 text-primary"/>
              <h3 className="font-black text-primary uppercase tracking-wide text-sm">Perícias Principais</h3>
          </div>
          
          <div className="rounded-xl border border-primary/10 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-primary/10">
                  <TableHead className="w-[140px] text-[10px] uppercase font-bold text-muted-foreground">Nome</TableHead>
                  <TableHead className="w-[70px] text-center text-[10px] uppercase font-bold text-muted-foreground">Total</TableHead>
                  <TableHead className="w-[100px] text-center text-[10px] uppercase font-bold text-muted-foreground">Proficiência</TableHead>
                  <TableHead className="text-center text-[10px] uppercase font-bold text-muted-foreground">Item</TableHead>
                  <TableHead className="text-center text-[10px] uppercase font-bold text-muted-foreground">ACP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SKILLS.map((skill) => {
                  const currentRank = watch(`skills.${skill.key}.rank`) || "U";
                  // Aqui usamos o VALOR CALCULADO do Contexto, que já soma tudo!
                  const total = skills?.[skill.key] || 0;
                  const armorPen = Number(watch(`skills.${skill.key}.armor`)) || 0;
                  
                  return (
                    <TableRow key={skill.key} className="border-b border-primary/5 h-12 transition-colors hover:bg-muted/5">
                      <TableCell className="py-1">
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground/90">{skill.label}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold bg-muted/50 px-1 rounded">{skill.attr}</span>
                                {skill.armor && armorPen > 0 && <ShieldAlert className="w-3 h-3 text-red-400" title="Sofre Penalidade de Armadura" />}
                              </div>
                          </div>
                      </TableCell>
                      
                      {/* BOTÃO DE ROLAGEM */}
                      <TableCell className="text-center py-1">
                        <button 
                            type="button"
                            onClick={() => rollCheck({ bonus: total, label: `Teste de ${skill.label}`, type: "skill", dice: "1d20" })}
                            className="w-full h-8 flex items-center justify-center font-black text-lg bg-background border border-primary/20 rounded-md shadow-sm hover:border-primary hover:text-primary transition-all active:scale-95 active:bg-primary/5"
                            title={`Rolar ${skill.label}`}
                        >
                            {total >= 0 ? "+" : ""}{total}
                        </button>
                      </TableCell>

                      <TableCell className="text-center py-1 px-1">
                        <Select onValueChange={(v) => setValue(`skills.${skill.key}.rank`, v, { shouldDirty: true })} defaultValue={currentRank} disabled={isReadOnly}>
                            <SelectTrigger className={`h-7 w-full text-[10px] font-bold border ${getRankStyle(currentRank)} focus:ring-0`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="U">Untrained</SelectItem>
                                <SelectItem value="T">Trained</SelectItem>
                                <SelectItem value="E">Expert</SelectItem>
                                <SelectItem value="M">Master</SelectItem>
                                <SelectItem value="L">Legendary</SelectItem>
                            </SelectContent>
                        </Select>
                      </TableCell>
                      
                      {/* Inputs de Item e ACP (Edição) */}
                      <TableCell className="p-1"><Input type="number" {...register(`skills.${skill.key}.item`)} className="h-7 text-center text-xs bg-transparent border-transparent hover:bg-background focus:bg-background focus:border-primary/30 p-0 font-medium" placeholder="0" readOnly={isReadOnly}/></TableCell>
                      <TableCell className="p-1"><Input type="number" {...register(`skills.${skill.key}.armor`)} className={`h-7 text-center text-xs bg-transparent border-transparent p-0 font-medium ${armorPen > 0 ? "text-red-500 font-bold" : "text-muted-foreground"}`} placeholder="-" readOnly={isReadOnly}/></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
      </div>

      {/* 2. LORES (SABER) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b-2 border-indigo-500/10">
            <h3 className="font-black text-indigo-900 uppercase tracking-wide text-sm flex items-center gap-2"><Book className="w-5 h-5 text-indigo-600"/> Saber (Lore)</h3>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => append({ name: "Nova Lore", rank: "T", item: 0, misc: 0 })} className="h-7 text-xs gap-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"><Plus className="w-3 h-3"/> Adicionar</Button>}
        </div>
        
        <div className="space-y-3">
            {fields.map((field, index) => {
                // Pega o valor CALCULADO do hook (que já somou Int + Nível + Proficiência)
                const loreTotal = lores?.[index]?.total || 0;
                const loreName = watch(`lores.${index}.name`) || "Saber";
                const currentRank = watch(`lores.${index}.rank`) || "T";
                
                return (
                    <div key={field.id} className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-indigo-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                        <div className="flex-1">
                            <Input 
                                {...register(`lores.${index}.name`)} 
                                className="h-6 font-bold bg-transparent border-none text-sm p-0 focus-visible:ring-0 text-indigo-950 placeholder:text-indigo-300" 
                                placeholder="Nome do Saber" 
                                readOnly={isReadOnly}
                            />
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Inteligência</span>
                        </div>
                        
                        {/* BOTÃO DE ROLAGEM LORE */}
                        <button 
                            type="button"
                            onClick={() => rollCheck({ bonus: loreTotal, label: `Teste de ${loreName}`, type: "skill", dice: "1d20" })}
                            className="w-12 h-10 flex items-center justify-center font-black text-lg bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 cursor-pointer active:scale-95 transition-all shadow-sm"
                            title={`Rolar ${loreName}`}
                        >
                            {loreTotal >= 0 ? "+" : ""}{loreTotal}
                        </button>

                        <div className="w-[100px]">
                             <Select onValueChange={(v) => setValue(`lores.${index}.rank`, v)} defaultValue={currentRank} disabled={isReadOnly}>
                                 <SelectTrigger className={`h-8 text-[10px] font-bold border ${getRankStyle(currentRank)}`}><SelectValue/></SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="U">Untrained</SelectItem>
                                     <SelectItem value="T">Trained</SelectItem>
                                     <SelectItem value="E">Expert</SelectItem>
                                     <SelectItem value="M">Master</SelectItem>
                                     <SelectItem value="L">Legendary</SelectItem>
                                 </SelectContent>
                             </Select>
                        </div>
                        
                        {!isReadOnly && <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" onClick={() => remove(index)}><Trash2 className="w-4 h-4"/></Button>}
                    </div>
                );
            })}
        </div>
      </div>

    </div>
  );
};