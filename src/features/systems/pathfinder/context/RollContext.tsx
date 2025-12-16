import React, { createContext, useContext, useState, ReactNode } from "react";
import { rollCheck, RollResult } from "../utils/pf2eDice";

interface RollContextType {
  history: RollResult[];
  makeRoll: (modifier: number, label: string, type?: RollResult['type'], dc?: number) => void;
  makeDamageRoll: (expression: string, label: string) => void; // <--- NOVO
  clearHistory: () => void;
}

const RollContext = createContext<RollContextType | null>(null);

export const useRollContext = () => {
  const context = useContext(RollContext);
  if (!context) throw new Error("useRollContext must be used within a RollProvider");
  return context;
};

export const RollProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<RollResult[]>([]);

  const makeRoll = (modifier: number, label: string, type: RollResult['type'] = "skill", dc?: number) => {
    const result = rollCheck(modifier, label, type, dc);
    setHistory((prev) => [result, ...prev]);
  };

  // --- NOVO: ROLADOR DE DANO SIMPLES ---
  const makeDamageRoll = (expression: string, label: string) => {
    // Parser simples: espera formato "1d8+4" ou "2d6"
    // Nota: Futuramente faremos um parser regex mais robusto.
    try {
        const parts = expression.toLowerCase().split('+');
        let total = 0;
        const breakdown: string[] = [];

        parts.forEach(part => {
            if (part.includes('d')) {
                const [count, faces] = part.split('d').map(Number);
                let subTotal = 0;
                const rolls = [];
                for (let i = 0; i < (count || 1); i++) {
                    const roll = Math.floor(Math.random() * (faces || 6)) + 1;
                    subTotal += roll;
                    rolls.push(roll);
                }
                total += subTotal;
                breakdown.push(`[${rolls.join(',')}]`);
            } else {
                const num = Number(part.trim());
                if (!isNaN(num)) {
                    total += num;
                    breakdown.push(`${num}`);
                }
            }
        });

        const result: RollResult = {
            total,
            die: 0, // Dano não tem "dado principal" único
            modifier: 0,
            label: `${label} (Dano)`,
            type: "flat", // Usamos flat para dano por enquanto
            bonusBreakdown: breakdown.join(' + ')
        };
        
        setHistory((prev) => [result, ...prev]);
    } catch (e) {
        console.error("Erro ao rolar dano", e);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <RollContext.Provider value={{ history, makeRoll, makeDamageRoll, clearHistory }}>
      {children}
    </RollContext.Provider>
  );
};