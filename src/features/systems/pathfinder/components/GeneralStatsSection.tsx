import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Shield, Brain, Zap, Footprints, Activity, Eye } from "lucide-react";
import { usePathfinderContext } from "../PathfinderContext";

export const GeneralStatsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, setValue, watch } = useFormContext();
  const { acTotal, classDC, perception, saves } = usePathfinderContext();

  const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="flex flex-col items-center justify-center p-3 bg-card border rounded-xl shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-1.5 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
      <span className={`text-2xl font-black z-10 ${color.replace('bg-', 'text-')}`}>{value}</span>
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider z-10">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. STATUS VITAIS & RECURSOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* HP CARD */}
          <Card className="lg:col-span-2 border-l-4 border-l-red-500/50">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4 text-red-500 font-bold text-sm uppercase tracking-wide">
                    <Heart className="w-4 h-4" /> Pontos de Vida
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1 text-center">
                        <Label className="text-[10px] text-muted-foreground uppercase">Atual</Label>
                        <Input type="number" {...register("hp.current")} className="h-12 text-center text-2xl font-black border-red-500/20 bg-red-500/5 focus:border-red-500" readOnly={isReadOnly}/>
                    </div>
                    <div className="space-y-1 text-center">
                        <Label className="text-[10px] text-muted-foreground uppercase">Máximo</Label>
                        <Input type="number" {...register("hp.max")} className="h-12 text-center text-xl bg-muted/10 border-transparent" readOnly={isReadOnly}/>
                    </div>
                    <div className="space-y-1 text-center">
                        <Label className="text-[10px] text-muted-foreground uppercase">Temp</Label>
                        <Input type="number" {...register("hp.temp")} className="h-12 text-center text-xl text-blue-400 bg-blue-500/5 border-transparent" readOnly={isReadOnly}/>
                    </div>
                </div>
                <div className="flex gap-4 pt-2 border-t border-border/50">
                    <div className="flex-1 flex items-center gap-2 bg-muted/10 p-2 rounded">
                        <Label className="text-[10px] w-16 text-muted-foreground font-bold">MORRENDO</Label>
                        <Input type="number" {...register("hp.dying")} className="h-7 text-center w-full bg-transparent border-none" max={4} readOnly={isReadOnly}/>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-muted/10 p-2 rounded">
                        <Label className="text-[10px] w-16 text-muted-foreground font-bold">FERIDO</Label>
                        <Input type="number" {...register("hp.wounded")} className="h-7 text-center w-full bg-transparent border-none" max={3} readOnly={isReadOnly}/>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* RECURSOS RÁPIDOS */}
          <div className="grid grid-cols-2 gap-3 h-full">
             <div className="bg-card border rounded-xl p-3 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                 <Zap className="w-12 h-12 absolute -right-2 -bottom-2 text-yellow-500/10" />
                 <Label className="text-[10px] uppercase font-bold text-yellow-600">Hero Points</Label>
                 <Input type="number" {...register("attributes.hero_points")} className="h-10 w-16 text-center text-2xl font-black bg-transparent border-none text-yellow-500 shadow-none focus-visible:ring-0" />
             </div>
             <div className="bg-card border rounded-xl p-3 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                 <Footprints className="w-12 h-12 absolute -right-2 -bottom-2 text-emerald-500/10" />
                 <Label className="text-[10px] uppercase font-bold text-emerald-600">Speed</Label>
                 <Input type="number" {...register("speeds.land")} className="h-10 w-16 text-center text-2xl font-black bg-transparent border-none text-emerald-500 shadow-none focus-visible:ring-0" placeholder="25" />
                 <span className="text-[9px] text-muted-foreground">ft</span>
             </div>
             <div className="col-span-2 bg-card border rounded-xl p-2 flex justify-between items-center px-4">
                 <span className="text-xs font-bold text-muted-foreground uppercase">Class DC</span>
                 <span className="text-xl font-black text-purple-500">{classDC}</span>
             </div>
          </div>
      </div>

      {/* 2. DEFESA & PERCEPÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-500/50">
             <CardContent className="p-4 flex items-center gap-4">
                 <div className="flex flex-col items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full border-2 border-blue-500/20 shrink-0">
                     <Shield className="w-5 h-5 text-blue-500 mb-1" />
                     <span className="text-2xl font-black text-blue-500 leading-none">{acTotal}</span>
                     <span className="text-[9px] font-bold uppercase text-blue-400/70">AC</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2 flex-1">
                     <div className="flex flex-col gap-1">
                         <Label className="text-[9px] text-center uppercase text-muted-foreground">Item</Label>
                         <Input type="number" {...register("ac.item")} className="h-8 text-center text-xs bg-muted/10 border-transparent" placeholder="0" readOnly={isReadOnly}/>
                     </div>
                     <div className="flex flex-col gap-1">
                         <Label className="text-[9px] text-center uppercase text-muted-foreground">Escudo</Label>
                         <Input type="number" {...register("ac.shield")} className="h-8 text-center text-xs bg-muted/10 border-transparent" placeholder="0" readOnly={isReadOnly}/>
                     </div>
                     <div className="flex flex-col gap-1">
                         <Label className="text-[9px] text-center uppercase text-muted-foreground">Cap</Label>
                         <Input type="number" {...register("ac.cap")} className="h-8 text-center text-xs bg-muted/10 border-transparent" placeholder="99" readOnly={isReadOnly}/>
                     </div>
                 </div>
             </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500/50">
             <CardContent className="p-4 flex items-center gap-4">
                 <div className="flex flex-col items-center justify-center w-20 h-20 bg-green-500/10 rounded-full border-2 border-green-500/20 shrink-0">
                     <Eye className="w-5 h-5 text-green-500 mb-1" />
                     <span className="text-2xl font-black text-green-500 leading-none">+{perception}</span>
                     <span className="text-[9px] font-bold uppercase text-green-400/70">Percepção</span>
                 </div>
                 <div className="flex-1 pl-4 border-l border-border/50">
                     <div className="flex justify-between items-center mb-2">
                         <Label className="text-xs">Proficiência</Label>
                         {isReadOnly ? <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">{watch("perception.rank")}</span> :
                         <Select onValueChange={(v) => setValue("perception.rank", v)} defaultValue={watch("perception.rank") || "U"}>
                             <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue/></SelectTrigger>
                             <SelectContent><SelectItem value="U">Untrained</SelectItem><SelectItem value="T">Trained</SelectItem><SelectItem value="E">Expert</SelectItem><SelectItem value="M">Master</SelectItem><SelectItem value="L">Legendary</SelectItem></SelectContent>
                         </Select>}
                     </div>
                     <div className="flex justify-between items-center">
                         <Label className="text-xs">Senses</Label>
                         <Input {...register("details.senses")} className="h-6 w-32 text-[10px] text-right bg-transparent border-none p-0 focus-visible:ring-0" placeholder="Darkvision..." readOnly={isReadOnly}/>
                     </div>
                 </div>
             </CardContent>
          </Card>
      </div>

      {/* 3. SAVES */}
      <div className="grid grid-cols-3 gap-4">
          <StatBox label="Fortitude" value={`+${saves?.fortitude || 0}`} icon={Activity} color="text-red-500" />
          <StatBox label="Reflex" value={`+${saves?.reflex || 0}`} icon={Activity} color="text-amber-500" />
          <StatBox label="Will" value={`+${saves?.will || 0}`} icon={Brain} color="text-blue-500" />
      </div>

    </div>
  );
};