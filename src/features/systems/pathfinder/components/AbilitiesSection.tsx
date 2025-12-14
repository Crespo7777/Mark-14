import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathfinderContext } from "../PathfinderContext";

const ABILITIES = [
  { key: "str", label: "Força" },
  { key: "dex", label: "Destreza" },
  { key: "con", label: "Constituição" },
  { key: "int", label: "Inteligência" },
  { key: "wis", label: "Sabedoria" },
  { key: "cha", label: "Carisma" },
] as const;

export const AbilitiesSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register } = useFormContext();
  const { mods } = usePathfinderContext();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {ABILITIES.map((ability) => {
        const mod = mods?.[ability.key] || 0;
        return (
        <Card key={ability.key} className="bg-card border-2 border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          {/* Header Colorido Sutil */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all"/>
          
          <div className="p-4 flex flex-col items-center gap-2">
            <Label className="text-[10px] font-bold uppercase text-primary/70 tracking-widest">
              {ability.label}
            </Label>
            
            <div className="relative w-full flex justify-center py-1">
              <Input
                type="number"
                {...register(`abilities.${ability.key}.value`)}
                className="h-12 w-20 text-center text-3xl font-black bg-transparent border-none shadow-none z-10 focus-visible:ring-0 text-primary"
                readOnly={isReadOnly}
              />
              {/* Círculo decorativo de fundo */}
              <div className="absolute inset-0 m-auto w-14 h-14 bg-primary/5 rounded-full -z-0 group-hover:bg-primary/10 transition-colors"/>
            </div>

            <div className={`text-sm font-bold px-4 py-0.5 rounded-full border border-border/50 ${mod >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
               {mod >= 0 ? "+" : ""}{mod}
            </div>
          </div>
        </Card>
      )})}
    </div>
  );
};