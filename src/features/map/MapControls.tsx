import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, MousePointer2, Ruler, Flashlight } from "lucide-react";
import { MapSettingsDialog } from "./MapSettingsDialog";
import { useTableContext } from "@/features/table/TableContext";
import { Table } from "@/types/app-types";

interface MapControlsProps {
    tableData: Table;
    activeTool?: string; 
    onToolChange?: (tool: string) => void;
}

export const MapControls = ({ tableData, activeTool = "select", onToolChange = () => {} }: MapControlsProps) => {
  const { isMaster } = useTableContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isFogEnabled = tableData.map_fog_enabled || false;

  return (
    <>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-xl flex flex-col gap-1">
                
                <Button 
                    variant={activeTool === "select" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={() => onToolChange("select")}
                    title="Selecionar e Mover"
                >
                    <MousePointer2 className="w-5 h-5" />
                </Button>

                {/* --- FERRAMENTA DE RÉGUA (Habilitada) --- */}
                <Button 
                    variant={activeTool === "measure" ? "secondary" : "ghost"} 
                    size="icon" 
                    className={`h-9 w-9 ${activeTool === "measure" ? "text-blue-400" : ""}`}
                    // Toggle: se já estiver ativa, volta para select
                    onClick={() => onToolChange(activeTool === "measure" ? "select" : "measure")}
                    title="Régua de Medição"
                >
                    <Ruler className="w-5 h-5" />
                </Button>

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
                    <>
                        <div className="h-px bg-white/20 mx-1" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 hover:text-primary" 
                            onClick={() => setSettingsOpen(true)}
                            title="Configurar Cena"
                        >
                            <Settings className="w-5 h-5" />
                        </Button>
                    </>
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