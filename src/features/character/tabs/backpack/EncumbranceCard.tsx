import { useCharacterCalculations } from "../../hooks/useCharacterCalculations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Weight } from "lucide-react";

export const EncumbranceCard = () => {
  const {
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
  } = useCharacterCalculations();

  const weightPercentage = Math.min(100, (currentWeight / (maxEncumbrance || 1)) * 100);
  const weightBarClass = currentWeight >= maxEncumbrance ? "bg-destructive" : (currentWeight > encumbranceThreshold ? "bg-amber-500" : "bg-primary");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Weight className="w-4 h-4"/> Carga</CardTitle>
        <CardDescription className="text-xs">Penalidade: <span className={encumbrancePenalty > 0 ? "text-destructive font-bold" : ""}>-{encumbrancePenalty}</span> na Defesa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
           <div className="flex justify-between text-sm">
              <span>Peso: <strong>{currentWeight}</strong></span>
              <span className="text-muted-foreground">Máx: {maxEncumbrance}</span>
           </div>
           <Progress value={weightPercentage} className="h-2" indicatorClassName={weightBarClass} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
            <div>Limiar: {encumbranceThreshold}</div>
            <div className="text-right">Imóvel: {maxEncumbrance}</div>
        </div>
      </CardContent>
    </Card>
  );
};