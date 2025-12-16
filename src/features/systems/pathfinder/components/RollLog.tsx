import { useRollContext } from "../context/RollContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Dices } from "lucide-react";
import { Card } from "@/components/ui/card";

export const RollLog = () => {
  const { history, clearHistory } = useRollContext();

  const getDegreeColor = (degree?: string) => {
    switch (degree) {
      case "crit-success": return "bg-green-500 text-white border-green-600";
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "failure": return "bg-red-50 text-red-800 border-red-200";
      case "crit-failure": return "bg-red-500 text-white border-red-600";
      default: return "bg-card border-border";
    }
  };

  const getDegreeLabel = (degree?: string) => {
    switch (degree) {
      case "crit-success": return "SUCESSO CRÍTICO";
      case "success": return "SUCESSO";
      case "failure": return "FALHA";
      case "crit-failure": return "FALHA CRÍTICA";
      default: return "";
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl flex flex-col gap-2 max-h-[500px]">
      <div className="flex justify-between items-center bg-primary text-primary-foreground p-2 rounded-t-lg shadow-md">
        <h3 className="font-bold flex items-center gap-2 text-sm"><Dices className="w-4 h-4"/> Log de Dados</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary-foreground/20" onClick={clearHistory}>
          <Trash2 className="w-3 h-3"/>
        </Button>
      </div>
      
      <ScrollArea className="flex-1 bg-background/95 backdrop-blur border rounded-b-lg p-3 gap-2 h-full overflow-y-auto">
        {history.map((roll, i) => (
          <Card key={i} className={`mb-3 p-3 border-l-4 shadow-sm ${roll.degree ? getDegreeColor(roll.degree).replace('bg-', 'border-l-') : 'border-l-primary'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm uppercase truncate w-[70%]">{roll.label}</span>
              <span className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dado Visual */}
              <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg font-black text-lg border ${roll.die === 20 ? "text-green-600 border-green-500 bg-green-50" : roll.die === 1 ? "text-red-600 border-red-500 bg-red-50" : "bg-muted text-foreground"}`}>
                {roll.die}
              </div>
              
              <div className="flex flex-col">
                <span className="text-xl font-bold">
                  {roll.total} <span className="text-xs font-normal text-muted-foreground">({roll.die} + {roll.modifier})</span>
                </span>
                
                {/* Resultado do Grau */}
                {roll.degree && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded w-fit ${getDegreeColor(roll.degree)}`}>
                    {getDegreeLabel(roll.degree)}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
};