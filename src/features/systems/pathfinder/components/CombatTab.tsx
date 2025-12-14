import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, Sword } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StrikesSection } from "./StrikesSection";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export const CombatTab = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, setValue, watch } = useFormContext();

  const ProfRow = ({ label, name }: { label: string, name: string }) => {
      const val = watch(name) || "U";
      const colors: Record<string, string> = { U: "text-muted-foreground", T: "text-green-500", E: "text-blue-500", M: "text-purple-500", L: "text-orange-500" };
      
      return (
        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
            <span className="text-xs font-medium">{label}</span>
            {isReadOnly ? <span className={`text-xs font-bold ${colors[val]}`}>{val}</span> : 
            <Select onValueChange={(v) => setValue(name, v)} defaultValue={val}>
                <SelectTrigger className={`h-6 w-24 text-[10px] font-bold border-none bg-muted/20 ${colors[val]}`}><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="U">Untrained</SelectItem><SelectItem value="T">Trained</SelectItem><SelectItem value="E">Expert</SelectItem><SelectItem value="M">Master</SelectItem><SelectItem value="L">Legendary</SelectItem></SelectContent>
            </Select>}
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: ATAQUES (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
            <StrikesSection isReadOnly={isReadOnly} />
            
            <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="p-3 pb-0"><CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-500"><AlertTriangle className="w-4 h-4"/> Condições & Resistências</CardTitle></CardHeader>
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Imunidades / Resistências</Label>
                        <Textarea {...register("details.resistances")} className="min-h-[60px] bg-background/50 border-none resize-none text-xs" placeholder="Ex: Fire 5..." readOnly={isReadOnly}/>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Condições Atuais</Label>
                        <Textarea {...register("details.conditions")} className="min-h-[60px] bg-background/50 border-none resize-none text-xs" placeholder="Ex: Frightened 1..." readOnly={isReadOnly}/>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* COLUNA DIREITA: PROFICIÊNCIAS & ESCUDO (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
            
            {/* ESCUDO */}
            <Card className="bg-card">
                <CardHeader className="p-3 pb-2 border-b"><CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Escudo</CardTitle></CardHeader>
                <CardContent className="p-3 space-y-3">
                    <Input {...register("shield.name")} placeholder="Nome do Escudo" className="h-8 font-bold text-center bg-muted/10 border-transparent" readOnly={isReadOnly}/>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/10 p-2 rounded text-center">
                            <Label className="text-[9px] uppercase text-muted-foreground">Hardness</Label>
                            <Input type="number" {...register("shield.hardness")} className="h-6 text-center bg-transparent border-none font-bold" placeholder="0" readOnly={isReadOnly}/>
                        </div>
                        <div className="bg-muted/10 p-2 rounded text-center">
                            <Label className="text-[9px] uppercase text-muted-foreground">BT</Label>
                            <Input type="number" {...register("shield.bt")} className="h-6 text-center bg-transparent border-none font-bold" placeholder="0" readOnly={isReadOnly}/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/10 p-2 rounded">
                        <Label className="text-[10px] uppercase w-12 shrink-0">HP</Label>
                        <Input type="number" {...register("shield.hp_current")} className="h-6 text-center bg-transparent border-none font-bold" placeholder="Curr" readOnly={isReadOnly}/>
                        <span className="text-muted-foreground">/</span>
                        <Input type="number" {...register("shield.hp_max")} className="h-6 text-center bg-transparent border-none font-bold" placeholder="Max" readOnly={isReadOnly}/>
                    </div>
                    <div className="flex items-center gap-2 justify-center pt-2">
                        <input type="checkbox" {...register("shield.raised")} disabled={isReadOnly} className="w-4 h-4 accent-blue-500"/>
                        <Label className={`text-xs font-bold ${watch("shield.raised") ? "text-blue-500" : "text-muted-foreground"}`}>Levantado (+AC)</Label>
                    </div>
                </CardContent>
            </Card>

            {/* PROFICIÊNCIAS LISTA */}
            <Card>
                <CardHeader className="p-3 pb-2 border-b"><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Proficiências</CardTitle></CardHeader>
                <CardContent className="p-3 space-y-4">
                    <div>
                        <Label className="text-[10px] font-bold text-primary mb-1 block">ARMADURAS</Label>
                        <ProfRow label="Light" name="proficiencies.light"/>
                        <ProfRow label="Medium" name="proficiencies.medium"/>
                        <ProfRow label="Heavy" name="proficiencies.heavy"/>
                        <ProfRow label="Unarmored" name="proficiencies.unarmed_defense"/>
                    </div>
                    <Separator />
                    <div>
                        <Label className="text-[10px] font-bold text-primary mb-1 block">ARMAS</Label>
                        <ProfRow label="Simple" name="proficiencies.simple"/>
                        <ProfRow label="Martial" name="proficiencies.martial"/>
                        <ProfRow label="Advanced" name="proficiencies.advanced"/>
                        <ProfRow label="Unarmed" name="proficiencies.unarmed_attack"/>
                    </div>
                </CardContent>
            </Card>

        </div>
    </div>
  );
};