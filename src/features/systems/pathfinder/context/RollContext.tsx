import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { rollCheck as pfRollCheck, calculateDamage, RollResult } from "../utils/pf2eDice";
import { supabase } from "@/integrations/supabase/client";

interface RollContextType {
  // Histórico
  history: RollResult[];
  
  // Funções de Rolagem
  makeRoll: (modifier: number, label: string, type?: RollResult['type'], dc?: number) => void;
  makeDamageRoll: (expression: string, label: string) => void;
  rollCheck: (params: { bonus: number; label: string; type?: any; dc?: number }) => void;
  rollDamage: (params: { formula: string; label: string; type: string }) => void;
  
  // Utilitários
  clearHistory: () => void;
  
  // GM Tools
  isGm: boolean;
  isSecretMode: boolean;
  toggleSecretMode: () => void;
}

const RollContext = createContext<RollContextType | null>(null);

export const useRoll = () => {
  const context = useContext(RollContext);
  if (!context) throw new Error("useRoll must be used within a RollProvider");
  return context;
};

export const useRollContext = useRoll;

interface RollProviderProps {
    children: ReactNode;
    characterName?: string;
    isGm?: boolean;
    webhookUrl?: string | null; // <--- NOVO: Recebe o link da mesa
}

export const RollProvider = ({ 
    children, 
    characterName = "Desconhecido",
    isGm = false,
    webhookUrl = null
}: RollProviderProps) => {
  const [history, setHistory] = useState<RollResult[]>([]);
  const { toast } = useToast();
  const [isSecretMode, setIsSecretMode] = useState(isGm);

  const toggleSecretMode = () => setIsSecretMode(prev => !prev);

  // --- INTEGRAÇÃO DISCORD ---
  const sendToDiscord = async (result: RollResult) => {
    // Se não houver webhook configurado na mesa, não faz nada
    if (!webhookUrl) return;

    try {
        const { error } = await supabase.functions.invoke('discord-handler-pathfinder', {
            body: {
                character: characterName,
                label: result.label,
                total: result.total,
                formula: result.type === 'damage' ? result.formula : `d20 ${result.modifier >= 0 ? '+' : ''}${result.modifier}`,
                breakdown: result.bonusBreakdown || "",
                type: result.type,
                degree: result.degree,
                is_secret: isSecretMode,
                webhook_url: webhookUrl // <--- Envia o link para o backend usar
            }
        });

        if (error) console.error("Erro Supabase (Discord):", error);
    } catch (err) {
        console.error("Erro de conexão (Discord):", err);
    }
  };

  const addResult = (result: RollResult) => {
      const resultWithMode = { ...result, isSecret: isSecretMode };
      
      setHistory((prev) => [resultWithMode, ...prev].slice(0, 50));
      sendToDiscord(resultWithMode);

      // Feedback Visual
      const isCrit = result.degree === 'crit-success' || result.die === 20;
      const isFail = result.degree === 'crit-failure' || result.die === 1;
      const secretPrefix = isSecretMode ? "🤫 [SECRETO] " : "";

      if (result.type === 'damage') {
          toast({
              title: `${secretPrefix}⚔️ ${result.label}: ${result.total} Dano`,
              description: `Fórmula: ${result.formula}`,
              className: isSecretMode 
                ? "border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950/20" 
                : "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20"
          });
      } else {
          toast({
              title: `${secretPrefix}🎲 ${result.label}: ${result.total}`,
              description: `Dado: ${result.die} ${result.modifier >= 0 ? '+' : ''}${result.modifier}`,
              variant: isFail ? "destructive" : "default",
              className: isSecretMode 
                ? "border-2 border-purple-400 shadow-sm bg-purple-50/10" 
                : (isCrit ? "border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "")
          });
      }
  };

  // --- ROLAGENS ---
  const makeRoll = useCallback((modifier: number, label: string, type: RollResult['type'] = "skill", dc?: number) => {
    const result = pfRollCheck(modifier, label, type, dc);
    addResult(result);
  }, [characterName, isSecretMode, webhookUrl]);

  const makeDamageRoll = useCallback((expression: string, label: string) => {
    try {
        const result = calculateDamage(expression, label);
        addResult(result);
    } catch (e) {
        console.error("Erro no dano:", e);
        toast({ title: "Erro na fórmula", variant: "destructive" });
    }
  }, [characterName, isSecretMode, webhookUrl]);

  const clearHistory = () => setHistory([]);

  const rollCheckWrapper = (params: { bonus: number; label: string; type?: any; dc?: number }) => {
      makeRoll(params.bonus, params.label, params.type, params.dc);
  };
  
  const rollDamageWrapper = (params: { formula: string; label: string; type: string }) => {
      makeDamageRoll(params.formula, params.label);
  };

  return (
    <RollContext.Provider value={{ 
        history, 
        makeRoll, 
        makeDamageRoll, 
        clearHistory,
        rollCheck: rollCheckWrapper,
        rollDamage: rollDamageWrapper,
        isGm,
        isSecretMode,
        toggleSecretMode
    }}>
      {children}
    </RollContext.Provider>
  );
};