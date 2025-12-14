import { createContext, useContext, ReactNode } from "react";

// Definição completa do que o contexto disponibiliza
export interface PathfinderContextType {
  mods: Record<string, number>;
  level: number;
  acTotal: number;
  classDC: number;
  perception: number;
  saves: {
    fortitude: number;
    reflex: number;
    will: number;
  };
  skills: Record<string, number>;
  lores: any[];
  // O CAMPO QUE FALTAVA:
  bulk: { 
    total: number; 
    encumbered: number; 
    max: number 
  }; 
  magic: {
    attack: number;
    dc: number;
  };
}

const PathfinderContext = createContext<PathfinderContextType | null>(null);

export const usePathfinderContext = () => {
  const context = useContext(PathfinderContext);
  if (!context) {
    throw new Error("usePathfinderContext must be used within a PathfinderProvider");
  }
  return context;
};

export const PathfinderProvider = ({ 
  children, 
  calculations 
}: { 
  children: ReactNode; 
  calculations: PathfinderContextType 
}) => {
  return (
    <PathfinderContext.Provider value={calculations}>
      {children}
    </PathfinderContext.Provider>
  );
};