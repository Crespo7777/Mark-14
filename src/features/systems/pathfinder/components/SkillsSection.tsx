import { useFormContext, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Book } from "lucide-react";
import { usePathfinderContext } from "../PathfinderContext";

const SKILLS = [
  { key: "acrobatics", label: "Acrobatics", attr: "Dex" },
  { key: "arcana", label: "Arcana", attr: "Int" },
  { key: "athletics", label: "Athletics", attr: "Str" },
  { key: "crafting", label: "Crafting", attr: "Int" },
  { key: "deception", label: "Deception", attr: "Cha" },
  { key: "diplomacy", label: "Diplomacy", attr: "Cha" },
  { key: "intimidation", label: "Intimidation", attr: "Cha" },
  { key: "medicine", label: "Medicine", attr: "Wis" },
  { key: "nature", label: "Nature", attr: "Wis" },
  { key: "occultism", label: "Occultism", attr: "Int" },
  { key: "performance", label: "Performance", attr: "Cha" },
  { key: "religion", label: "Religion", attr: "Wis" },
  { key: "society", label: "Society", attr: "Int" },
  { key: "stealth", label: "Stealth", attr: "Dex" },
  { key: "survival", label: "Survival", attr: "Wis" },
  { key: "thievery", label: "Thievery", attr: "Dex" },
] as const;

export const SkillsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, setValue, watch, control } = useFormContext();
  const { skills, lores } = usePathfinderContext();
  const { fields, append, remove } = useFieldArray({ control, name: "lores" });

  const getRankStyle = (rank: string) => {
      switch(rank) {
          case 'T': return "text-green-600 font-bold bg-green-500/10 border-green-200";
          case 'E': return "text-blue-600 font-bold bg-blue-500/10 border-blue-200";
          case 'M': return "text-purple-600 font-bold bg-purple-500/10 border-purple-200";
          case 'L': return "text-orange-600 font-bold bg-orange-500/10 border-orange-200";
          default: return "text-muted-foreground bg-muted/50 border-transparent";
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
      
      {/* 1. PERÍCIAS PRINCIPAIS */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/20">
              <Book className="w-5 h-5 text-primary"/>
              <h3 className="font-bold text-primary uppercase tracking-wide text-sm">Perícias Principais</h3>
          </div>
          
          <div className="rounded-lg border border-primary/20 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-primary/5 border-primary/10">
                  <TableHead className="w-[140px] text-xs h-8 text-primary font-bold">Nome</TableHead>
                  <TableHead className="w-[50px] text-center text-xs h-8 text-primary font-bold">Total</TableHead>
                  <TableHead className="w-[100px] text-center text-xs h-8 text-primary font-bold">Prof</TableHead>
                  <TableHead className="text-center text-xs h-8 text-primary font-bold">Item</TableHead>
                  <TableHead className="text-center text-xs h-8 text-primary font-bold">Penal.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SKILLS.map((skill) => {
                  const currentRank = watch(`skills.${skill.key}.rank`) || "U";
                  const total = skills?.[skill.key] || 0;
                  
                  return (
                    <TableRow key={skill.key} className="hover:bg-accent/5 border-primary/10 h-10">
                      <TableCell className="font-medium py-1">
                          <div className="flex flex-col">
                              <span className="text-sm">{skill.label}</span>
                              <span className="text-[9px] text-muted-foreground uppercase font-bold">{skill.attr}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <span className="text-sm font-black font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                            {total >= 0 ? "+" : ""}{total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-1 px-1">
                        {isReadOnly ? (
                            <Badge variant="outline" className={`w-full justify-center text-[10px] h-6 ${getRankStyle(currentRank)}`}>{currentRank}</Badge>
                        ) : (
                            <Select onValueChange={(v) => setValue(`skills.${skill.key}.rank`, v, { shouldDirty: true })} defaultValue={currentRank}>
                                <SelectTrigger className={`h-6 w-full text-[10px] border ${getRankStyle(currentRank)}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="U">Untrained</SelectItem>
                                    <SelectItem value="T">Trained</SelectItem>
                                    <SelectItem value="E">Expert</SelectItem>
                                    <SelectItem value="M">Master</SelectItem>
                                    <SelectItem value="L">Legendary</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                      </TableCell>
                      <TableCell className="p-1"><Input type="number" {...register(`skills.${skill.key}.item`)} className="h-6 text-center text-xs bg-transparent border-transparent hover:bg-accent/10 focus:bg-accent/10 p-0" placeholder="0" readOnly={isReadOnly}/></TableCell>
                      <TableCell className="p-1"><Input type="number" {...register(`skills.${skill.key}.armor`)} className="h-6 text-center text-xs text-red-400 bg-transparent border-transparent hover:bg-accent/10 p-0" placeholder="-" readOnly={isReadOnly}/></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
      </div>

      {/* 2. LORES (SABER) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-indigo-200">
            <h3 className="font-bold text-indigo-700 uppercase tracking-wide text-sm flex items-center gap-2"><Book className="w-4 h-4"/> Saber (Lore)</h3>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => append({ name: "Nova Lore", rank: "T", item: 0, misc: 0 })} className="h-7 text-xs gap-1 text-indigo-600 hover:bg-indigo-50"><Plus className="w-3 h-3"/> Add</Button>}
        </div>
        
        <div className="space-y-2">
            {fields.length === 0 && <div className="text-center p-6 border-2 border-dashed border-indigo-200 rounded-lg text-xs text-indigo-400 bg-indigo-50/20">Nenhum saber adicionado.</div>}
            
            {fields.map((field, index) => {
                const loreTotal = lores?.[index]?.total || 0;
                const currentRank = watch(`lores.${index}.rank`) || "T";
                return (
                    <div key={field.id} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                        <Input {...register(`lores.${index}.name`)} className="h-8 font-bold flex-1 bg-transparent border-none text-sm p-0 focus-visible:ring-0" placeholder="Nome do Saber" readOnly={isReadOnly}/>
                        
                        <div className="w-8 h-8 flex items-center justify-center font-black text-sm bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                            {loreTotal >= 0 ? "+" : ""}{loreTotal}
                        </div>

                        <div className="w-[100px]">
                            {!isReadOnly ? (
                                <Select onValueChange={(v) => setValue(`lores.${index}.rank`, v)} defaultValue={currentRank}>
                                    <SelectTrigger className={`h-7 text-[10px] ${getRankStyle(currentRank)}`}><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="U">Untrained</SelectItem>
                                        <SelectItem value="T">Trained</SelectItem>
                                        <SelectItem value="E">Expert</SelectItem>
                                        <SelectItem value="M">Master</SelectItem>
                                        <SelectItem value="L">Legendary</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge variant="outline" className={getRankStyle(currentRank)}>{currentRank}</Badge>
                            )}
                        </div>
                        
                        {!isReadOnly && <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-300 hover:text-red-500" onClick={() => remove(index)}><Trash2 className="w-3.5 h-3.5"/></Button>}
                    </div>
                );
            })}
        </div>
      </div>

    </div>
  );
};