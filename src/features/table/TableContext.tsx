import { createContext, useContext, ReactNode, SetStateAction, Dispatch } from "react";
import { MapToken, FogShape } from "@/types/map-types"; 
import { Character, Combatant, Table } from "@/types/app-types"; // <--- Importar Table

export interface TableMember {
  id: string; 
  display_name: string;
  isMaster: boolean;
  isHelper: boolean; 
}

interface TableContextType {
  tableId: string;
  masterId: string;
  userId: string;
  isMaster: boolean;
  isHelper: boolean;
  
  // --- NOVO: DADOS DA MESA (Para saber o sistema) ---
  tableData: Table; 
  
  members: TableMember[]; 
  setMembers: Dispatch<SetStateAction<TableMember[]>>;

  mapTokens: MapToken[]; 
  setMapTokens: Dispatch<SetStateAction<MapToken[]>>; 
  
  characters: Character[];

  fogShapes: FogShape[]; 
  setFogShapes: Dispatch<SetStateAction<FogShape[]>>;

  combatants: Combatant[];
}

export const TableContext = createContext<TableContextType | null>(null);

interface TableProviderProps {
  children: ReactNode;
  value: TableContextType;
}

export const TableProvider = ({ children, value }: TableProviderProps) => {
  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTableContext deve ser usado dentro de um TableProvider");
  }
  return context;
};