import { Database } from "@/integrations/supabase/types";
import { useTableContext } from "@/features/table/TableContext";
// Importa a ficha antiga (agora no local novo)
import { SymbaroumNpcSheet } from "@/features/systems/symbaroum/npc/SymbaroumNpcSheet";
// Importa a ficha nova (placeholder)
import { PathfinderNpcSheet } from "@/features/systems/pathfinder/npc/PathfinderNpcSheet";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { tableData } = useTableContext();
  const system = tableData?.system_type || 'symbaroum';

  // Lógica de Decisão
  if (system === 'pathfinder') {
      return <PathfinderNpcSheet initialNpc={initialNpc} onClose={onClose} />;
  }

  // Padrão: Symbaroum
  return <SymbaroumNpcSheet initialNpc={initialNpc} onClose={onClose} />;
};