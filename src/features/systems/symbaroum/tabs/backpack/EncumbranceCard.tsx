import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Scale } from "lucide-react";
// CORREÇÃO: Hook específico do sistema
import { useSymbaroumCalculations } from "../../hooks/useSymbaroumCalculations";
import { useFormContext } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";

export const EncumbranceCard = () => {
  const { totalWeight, maxLoad, encumbranceStatus } = useSymbaroumCalculations();
  const { watch } = useFormContext();

  const inventory = watch("inventory") || [];
  const projectiles = watch("projectiles") || [];

  // Função auxiliar para tratar peso na visualização
  const parseWeight = (val: any) => {
    if (typeof val === "number") return val;
    return parseFloat(val?.toString().replace(",", ".") || "0") || 0;
  };

  // Junta apenas Inventário e Munição
  const allItems = [
    ...inventory.map((i: any) => ({ ...i, type: 'Item' })),
    ...projectiles.map((p: any) => ({ ...p, type: 'Munição' }))
  ]
  .map((item: any) => {
     // O peso total é simplesmente o peso declarado no item
     const declaredWeight = parseWeight(item.weight);
     return { ...item, declaredWeight };
  })
  .filter((i: any) => i.declaredWeight > 0) // Só mostra o que tem peso > 0
  .sort((a: any, b: any) => b.declaredWeight - a.declaredWeight); // Ordena do mais pesado pro mais leve

  // Porcentagem da barra
  const percentage = Math.min(100, (totalWeight / (maxLoad || 1)) * 100);
  
  // Define cor da barra
  let progressColor = "bg-primary";
  if (totalWeight > maxLoad) progressColor = "bg-destructive"; // Passou do limite
  else if (totalWeight > maxLoad / 2) progressColor = "bg-yellow-500"; // Pesado

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><Scale className="w-4 h-4" /> Carga da Mochila</span>
          <span className={totalWeight > maxLoad ? "text-destructive font-bold" : "text-muted-foreground"}>
            {totalWeight.toFixed(1)} / {maxLoad}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-1">
            <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
            <p className={`text-xs text-right ${totalWeight > maxLoad ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {encumbranceStatus}
            </p>
        </div>

        <div className="flex-1 min-h-0">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Detalhamento (Mochila)</h4>
            <ScrollArea className="h-[120px] pr-3">
                <div className="space-y-2">
                    {allItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Mochila vazia.</p>
                    ) : (
                        allItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b border-border/50 pb-1 last:border-0">
                                <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[120px]">{item.name || "Sem nome"}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {item.type} {item.quantity > 1 ? `(x${item.quantity})` : ""}
                                    </span>
                                </div>
                                <span className="font-mono tabular-nums opacity-80">
                                    {item.declaredWeight.toFixed(1)} kg
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};