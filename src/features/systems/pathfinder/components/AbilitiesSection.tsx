import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathfinderContext } from "../PathfinderContext";
import { useRoll } from "../context/RollContext";

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
  const { rollCheck } = useRoll();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {ABILITIES.map((ability) => {
        // Fallback seguro: se mods for undefined, usa 0.
        // O cálculo deve acontecer no hook usePathfinderCalculations
        const mod = mods?.[ability.key] ?? 0;
        const modSign = mod >= 0 ? "+" : "";
        
        return (
        <Card key={ability.key} className="bg-card border-2 border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all"/>
          
          <div className="p-4 flex flex-col items-center gap-2">
            <Label className="text-[10px] font-bold uppercase text-primary/70 tracking-widest cursor-help" title={`Atributo Base: ${ability.label}`}>
              {ability.label}
            </Label>
            
            <div className="relative w-full flex justify-center py-1">
              {/* Removido valueAsNumber para evitar comportamento estranho com strings vazias */}
              {/* O usePathfinderCalculations deve lidar com "18" string convertendo para numero */}
              <Input
                type="number"
                {...register(`abilities.${ability.key}.value`)}
                className="h-12 w-20 text-center text-3xl font-black bg-transparent border-none shadow-none z-10 focus-visible:ring-0 text-primary"
                readOnly={isReadOnly}
                placeholder="10"
              />
              <div className="absolute inset-0 m-auto w-14 h-14 bg-primary/5 rounded-full -z-0 group-hover:bg-primary/10 transition-colors"/>
            </div>

            <button
                type="button" 
                onClick={() => rollCheck({ bonus: mod, label: `Teste de ${ability.label}`, type: "skill", dice: "1d20" })}
                className={`text-sm font-bold px-4 py-0.5 rounded-full border border-border/50 cursor-pointer active:scale-95 transition-transform ${mod >= 0 ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"}`}
                title={`Rolar Teste de ${ability.label}`}
            >
               {modSign}{mod}
            </button>
          </div>
        </Card>
      )})}
    </div>
  );
};