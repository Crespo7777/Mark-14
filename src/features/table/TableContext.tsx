// src/features/table/TableContext.tsx

import { createContext, useContext, ReactNode, SetStateAction, Dispatch } from "react";

// --- TIPO ATUALIZADO: Membro da Mesa ---
export interface TableMember {
  id: string; // user_id (ou master_id)
  display_name: string;
  isMaster: boolean;
  isHelper: boolean; // <--- NOVO CAMPO: Define se é Ajudante
}

interface TableContextType {
  tableId: string;
  masterId: string;
  userId: string;
  isMaster: boolean;
  isHelper: boolean; // <--- NOVO CAMPO: Permissão do usuário atual
  members: TableMember[]; 
  setMembers: Dispatch<SetStateAction<TableMember[]>>;
}

const TableContext = createContext<TableContextType | null>(null);

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