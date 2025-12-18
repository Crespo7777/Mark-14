import { useTableContext } from "@/features/table/TableContext";
// Importa a ficha do Symbaroum (Já no local correto, organizado)
import { SymbaroumNpcSheet } from "@/features/systems/symbaroum/npc/SymbaroumNpcSheet";
// Removida importação do Pathfinder pois o arquivo foi deletado na limpeza
import { Database } from "@/integrations/supabase/types";
import { AlertTriangle } from "lucide-react";

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
      // Placeholder temporário enquanto a casa está sendo arrumada
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

  // Padrão: Symbaroum
  // Repassa os props para o componente que isolamos na pasta do sistema
  // Nota: Precisamos adaptar os props porque o SymbaroumNpcSheet espera npcId, não o objeto todo
  // Mas como movemos a lógica, o ideal é que ele aceite o ID.
  return <SymbaroumNpcSheet npcId={initialNpc.id} onClose={onClose} />;
};