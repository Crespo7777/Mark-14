import { useEffect, useRef } from "react";
import { useRoll } from "../context/RollContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Dices, Skull, Shield, Sword, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RollLog = () => {
  const { history, clearHistory, isGm, isSecretMode, toggleSecretMode } = useRoll();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Se não houver histórico e não for GM (que precisa ver os botões), esconde
  if (history.length === 0 && !isGm) return null;

  const getIcon = (type: string) => {
      switch(type) {
          case 'attack': return <Sword className="w-3 h-3"/>;
          case 'damage': return <Skull className="w-3 h-3"/>;
          case 'save': return <Shield className="w-3 h-3"/>;
          case 'skill': return <Dices className="w-3 h-3"/>;
          default: return <Dices className="w-3 h-3"/>;
      }
  };

  const getDegreeStyles = (degree?: string, type?: string, isSecret?: boolean) => {
      if (isSecret) {
          return {
              container: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
              text: "text-purple-700 dark:text-purple-400",
              label: "SECRETO"
          };
      }

      if (type === 'damage') {
          return {
              container: "border-l-red-600 bg-red-50 dark:bg-red-950/30",
              text: "text-red-700 dark:text-red-400",
              label: "DANO"
          };
      }
      
      switch (degree) {
          case "crit-success": return { container: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", label: "CRÍTICO" };
          case "success": return { container: "border-l-green-500 bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", label: "SUCESSO" };
          case "failure": return { container: "border-l-slate-400 bg-slate-100 dark:bg-slate-900/50", text: "text-slate-600 dark:text-slate-400", label: "FALHA" };
          case "crit-failure": return { container: "border-l-red-600 bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", label: "FALHA CRÍT." };
          default: return { container: "border-l-primary bg-card", text: "text-foreground", label: "" };
      }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl flex flex-col gap-0 max-h-[400px] animate-in slide-in-from-bottom-5 pointer-events-auto">
      <div className="flex justify-between items-center bg-foreground text-background p-2 rounded-t-lg shadow-md z-10 border-b border-border/10">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                <Dices className="w-3 h-3"/> Log
            </span>
            
            {/* TOGGLE GM SECRETO */}
            {isGm && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-6 px-2 text-[10px] gap-1 font-bold transition-all ${isSecretMode ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                    onClick={toggleSecretMode}
                    title={isSecretMode ? "Modo Secreto ATIVO (Clique para Público)" : "Modo Público (Clique para Secreto)"}
                >
                    {isSecretMode ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                    {isSecretMode ? "SECRETO" : "PÚBLICO"}
                </Button>
            )}
        </div>

        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-background/20 hover:text-white" onClick={clearHistory}>
          <Trash2 className="w-3 h-3"/>
        </Button>
      </div>
      
      <ScrollArea className="flex-1 bg-background/95 backdrop-blur-sm border border-t-0 rounded-b-lg p-3 h-full shadow-inner min-h-[100px]">
        <div className="flex flex-col gap-2">
            {history.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8 italic opacity-50">
                    O destino aguarda...
                </div>
            )}

            {history.map((roll: any, i) => {
                const style = getDegreeStyles(roll.degree, roll.type, roll.isSecret);
                
                return (
                  <div key={i} className={`relative p-2 pl-3 rounded border border-l-4 shadow-sm text-sm ${style.container} animate-in slide-in-from-right-2 duration-300`}>
                    
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-foreground/90 leading-none">
                          {getIcon(roll.type)} {roll.label}
                      </span>
                      {roll.isSecret && <EyeOff className="w-3 h-3 text-purple-500 opacity-50"/>}
                    </div>
                    
                    <div className="flex items-end justify-between mt-2">
                        <div className="flex flex-col text-[10px] text-muted-foreground font-mono leading-tight">
                            {roll.type === 'damage' ? (
                                <>
                                    <span className="opacity-70">Fórmula: {roll.formula}</span>
                                    <span>{roll.bonusBreakdown}</span>
                                </>
                            ) : (
                                <>
                                    <span className="opacity-70">d20 ({roll.die}) {roll.modifier >= 0 ? '+' : ''} {roll.modifier}</span>
                                    {roll.bonusBreakdown && <span>{roll.bonusBreakdown}</span>}
                                </>
                            )}
                        </div>

                        <div className="text-right">
                            {style.label && <div className={`text-[9px] font-black uppercase mb-0.5 ${style.text}`}>{style.label}</div>}
                            <span className={`text-2xl font-black leading-none ${style.text}`}>
                                {roll.total}
                            </span>
                        </div>
                    </div>
                  </div>
                );
            })}
            <div ref={bottomRef} className="h-1" />
        </div>
      </ScrollArea>
    </div>
  );
};