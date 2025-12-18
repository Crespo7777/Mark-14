import { useTableContext } from "@/features/table/TableContext";
import { Button } from "@/components/ui/button";
import { Axe, Construction } from "lucide-react";

// Importa o Tracker do Symbaroum (Local Novo)
import { SymbaroumCombatTracker } from "@/features/systems/symbaroum/combat/SymbaroumCombatTracker";

interface CombatTrackerProps {
  isMaster?: boolean;
}

export const CombatTracker = ({ isMaster }: CombatTrackerProps) => {
  const { tableData } = useTableContext();
  const system = tableData?.system_type || "symbaroum";

  // Lógica de Roteamento
  switch (system) {
    case "pathfinder":
      // Placeholder para o futuro Tracker do Pathfinder
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground gap-4 border-2 border-dashed rounded-xl m-4">
            <div className="bg-primary/10 p-4 rounded-full">
                <Axe className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Combate Pathfinder</h3>
            <p className="text-center max-w-xs">
                O módulo de combate tático para Pathfinder 2e está em desenvolvimento.
            </p>
            {isMaster && (
                <Button variant="outline" className="gap-2">
                    <Construction className="w-4 h-4"/> Configurar Grid (WIP)
                </Button>
            )}
        </div>
      );

    case "symbaroum":
    default:
      // Carrega o Tracker Específico que acabamos de mover
      // O ID da mesa vem do contexto, mas o componente antigo pedia via prop?
      // O hook useTableRealtime usa o ID. Vamos passar o ID do contexto.
      return <SymbaroumCombatTracker tableId={tableData?.id || ""} isMaster={isMaster} />;
  }
};