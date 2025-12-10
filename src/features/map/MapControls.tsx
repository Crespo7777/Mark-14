import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, MousePointer2, Ruler, Flashlight, Target, Swords } from "lucide-react";
import { MapSettingsDialog } from "./MapSettingsDialog";
import { useTableContext } from "@/features/table/TableContext";
import { Table } from "@/types/app-types";

interface MapControlsProps {
    tableData: Table;
    activeTool?: string; 
    onToolChange?: (tool: string) => void;
    // Novos props para controlar o Tracker
    isCombatOpen: boolean;
    onToggleCombat: () => void;
}

export const MapControls = ({ 
    tableData, 
    activeTool = "select", 
    onToolChange = () => {},
    isCombatOpen,
    onToggleCombat
}: MapControlsProps) => {
  const { isMaster } = useTableContext();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Verificamos se o nevoeiro está ativo nas configurações da tabela
  const isFogEnabled = tableData.map_fog_enabled || false;

  return (
    <>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-xl flex flex-col gap-1">
                
                {/* 1. SELEÇÃO */}
                <Button 
                    variant={activeTool === "select" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => onToolChange("select")}
                    title="Selecionar e Mover"
                >
                    <MousePointer2 className="w-5 h-5" />
                </Button>

                {/* 2. PING */}
                <Button 
                    variant={activeTool === "ping" ? "secondary" : "ghost"} 
                    size="icon" 
                    className={`h-9 w-9 ${activeTool === "ping" ? "text-red-400" : ""}`}
                    onClick={() => onToolChange(activeTool === "ping" ? "select" : "ping")}
                    title="Ping (Chamar Atenção)"
                >
                    <Target className="w-5 h-5" />
                </Button>

                {/* 3. RÉGUA */}
                <Button 
                    variant={activeTool === "measure" ? "secondary" : "ghost"} 
                    size="icon" 
                    className={`h-9 w-9 ${activeTool === "measure" ? "text-blue-400" : ""}`}
                    onClick={() => onToolChange(activeTool === "measure" ? "select" : "measure")}
                    title="Régua de Medição"
                >
                    <Ruler className="w-5 h-5" />
                </Button>

                {/* 4. COMBATE (NOVO) */}
                <Button 
                    variant={isCombatOpen ? "secondary" : "ghost"} 
                    size="icon" 
                    className={`h-9 w-9 ${isCombatOpen ? "text-orange-400 bg-orange-400/10" : "hover:text-orange-400"}`}
                    onClick={onToggleCombat}
                    title="Rastreador de Combate / Iniciativa"
                >
                    <Swords className="w-5 h-5" />
                </Button>

                {/* Separador */}
                <div className="h-px bg-white/10 mx-1 my-0.5" />

                {/* 5. LANTERNA (Só aparece se Mestre E Fog Ativo) */}
                {isMaster && isFogEnabled && (
                    <Button 
                        variant={activeTool === "reveal" ? "secondary" : "ghost"} 
                        size="icon" 
                        className={`h-9 w-9 ${activeTool === "reveal" ? "text-yellow-400" : ""}`}
                        onClick={() => onToolChange(activeTool === "reveal" ? "select" : "reveal")}
                        title="Lanterna: Revelar Nevoeiro"
                    >
                        <Flashlight className="w-5 h-5" />
                    </Button>
                )}

                {isMaster && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:text-primary" 
                        onClick={() => setSettingsOpen(true)}
                        title="Configurar Cena"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </div>

        {isMaster && (
            <MapSettingsDialog 
                open={settingsOpen} 
                onOpenChange={setSettingsOpen}
                currentSettings={{
                    url: tableData.map_background_url || null,
                    gridSize: tableData.map_grid_size || 50,
                    gridOpacity: tableData.map_grid_opacity || 0.2,
                    fogEnabled: tableData.map_fog_enabled || false 
                }} 
            />
        )}
    </>
  );
};