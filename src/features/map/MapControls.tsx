// src/features/map/MapControls.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, MousePointer2, Ruler, Target, Swords, Brush, Square, Circle as CircleIcon } from "lucide-react";
import { MapSettingsDialog } from "./MapSettingsDialog";
import { useTableContext } from "@/features/table/TableContext";
import { Table } from "@/types/app-types";
import { cn } from "@/lib/utils";

interface MapControlsProps {
    tableData: Table;
    activeTool?: string; 
    onToolChange?: (tool: string) => void;
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
  const isFogEnabled = tableData.map_fog_enabled || false;

  // Toggle tool: Se clicar na ativa, desativa e volta a Select
  const toggleTool = (tool: string) => {
      if (activeTool === tool) {
          onToolChange("select");
      } else {
          onToolChange(tool);
      }
  };

  return (
    <>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-xl flex flex-col gap-1">
                
                <ControlButton 
                    icon={<MousePointer2 className="w-5 h-5" />} 
                    isActive={activeTool === "select"} 
                    onClick={() => toggleTool("select")} 
                    tooltip="Selecionar" 
                />
                <ControlButton 
                    icon={<Target className="w-5 h-5" />} 
                    isActive={activeTool === "ping"} 
                    onClick={() => toggleTool("ping")} 
                    tooltip="Ping" 
                    colorClass="text-red-400" 
                />
                <ControlButton 
                    icon={<Ruler className="w-5 h-5" />} 
                    isActive={activeTool === "measure"} 
                    onClick={() => toggleTool("measure")} 
                    tooltip="Régua" 
                    colorClass="text-blue-400" 
                />
                
                <Button 
                    variant={isCombatOpen ? "secondary" : "ghost"} 
                    size="icon" 
                    className={`h-9 w-9 ${isCombatOpen ? "text-orange-400 bg-orange-400/10" : "hover:text-orange-400"}`}
                    onClick={onToggleCombat}
                    title="Combate"
                >
                    <Swords className="w-5 h-5" />
                </Button>

                <div className="h-px bg-white/10 mx-1 my-0.5" />

                {isMaster && isFogEnabled && (
                    <>
                        <ControlButton 
                            icon={<Brush className="w-5 h-5" />} 
                            isActive={activeTool === "reveal"} 
                            onClick={() => toggleTool("reveal")} 
                            tooltip="Lanterna (Pincel)" 
                            colorClass="text-yellow-400"
                        />
                        <ControlButton 
                            icon={<Square className="w-5 h-5" />} 
                            isActive={activeTool === "reveal-rect"} 
                            onClick={() => toggleTool("reveal-rect")} 
                            tooltip="Revelar Retângulo" 
                            colorClass="text-yellow-400"
                        />
                        <ControlButton 
                            icon={<CircleIcon className="w-5 h-5" />} 
                            isActive={activeTool === "reveal-circle"} 
                            onClick={() => toggleTool("reveal-circle")} 
                            tooltip="Revelar Círculo" 
                            colorClass="text-yellow-400"
                        />
                    </>
                )}

                {isMaster && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-primary" onClick={() => setSettingsOpen(true)} title="Configurar Cena">
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

const ControlButton = ({ icon, isActive, onClick, tooltip, colorClass = "" }: any) => (
    <Button 
        variant={isActive ? "secondary" : "ghost"} 
        size="icon" 
        className={cn("h-9 w-9", isActive && colorClass)} 
        onClick={onClick} 
        title={tooltip}
    >
        {icon}
    </Button>
);