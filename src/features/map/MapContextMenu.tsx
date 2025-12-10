import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CloudFog, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTableContext } from "@/features/table/TableContext"; // Importar contexto para limpar estado local

interface MapContextMenuProps {
  position: { x: number; y: number };
  tableId: string;
  fogEnabled: boolean;
  onClose: () => void;
}

export const MapContextMenu = ({ position, tableId, fogEnabled, onClose }: MapContextMenuProps) => {
  const queryClient = useQueryClient();
  const { setFogShapes } = useTableContext();

  const handleToggleFog = async (checked: boolean) => {
    // 1. Atualiza a configuração da Tabela
    const updateTable = supabase
      .from("tables")
      .update({ map_fog_enabled: checked })
      .eq("id", tableId);

    // 2. RESETA O FOG (Apaga tudo da tabela map_fog)
    const resetFog = supabase
      .from("map_fog")
      .delete()
      .eq("table_id", tableId);

    // Executa em paralelo
    const [tableRes, fogRes] = await Promise.all([updateTable, resetFog]);

    if (tableRes.error || fogRes.error) {
      console.error("Erro ao atualizar Fog:", tableRes.error || fogRes.error);
    } else {
      // 3. Feedback Imediato
      setFogShapes([]); // Limpa visualmente agora
      queryClient.invalidateQueries({ queryKey: ["table-view", tableId] }); // Atualiza config
      queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] }); // Garante sync
    }
  };

  return (
    <div 
      className="absolute z-50 min-w-[200px] bg-black/90 border border-white/20 rounded-md shadow-2xl backdrop-blur-sm p-2 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100"
      style={{ 
        left: position.x, 
        top: position.y,
      }}
      onMouseDown={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opções do Mapa</span>
        <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-white" onClick={onClose} />
      </div>

      {/* Opção: Fog of War */}
      <div className="flex items-center justify-between hover:bg-white/10 p-2 rounded transition-colors cursor-pointer" onClick={() => handleToggleFog(!fogEnabled)}>
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <CloudFog className={`w-4 h-4 ${fogEnabled ? "text-primary" : "text-muted-foreground"}`} />
                <Label className="cursor-pointer text-sm font-medium">Nevoeiro</Label>
            </div>
            <span className="text-[9px] text-muted-foreground ml-6">Resetar ao alternar</span>
        </div>
        <Switch 
            checked={fogEnabled}
            onCheckedChange={handleToggleFog}
            className="scale-75"
        />
      </div>
    </div>
  );
};