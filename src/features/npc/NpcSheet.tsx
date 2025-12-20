import { useTableContext } from "@/features/table/TableContext";
import { SymbaroumNpcSheet } from "@/features/systems/symbaroum/npc/SymbaroumNpcSheet";
import { Database } from "@/integrations/supabase/types";
import { AlertTriangle } from "lucide-react";

// CORREÇÃO: 'npcs'
type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { tableData } = useTableContext();
  const system = tableData?.system_type || 'symbaroum';

  if (system === 'pathfinder') {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="bg-yellow-500/10 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold">Em Construção</h2>
            <p className="text-muted-foreground">
                O módulo de NPC para Pathfinder está passando por uma reestruturação completa.
            </p>
        </div>
      );
  }

  return <SymbaroumNpcSheet initialNpc={initialNpc} onClose={onClose} />;
};