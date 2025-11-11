// src/features/table/TableContext.tsx

import { createContext, useContext, ReactNode } from "react";

// --- 1. NOVO TIPO: Membro da Mesa ---
// Uma interface simplificada para nossos propósitos
export interface TableMember {
  id: string; // user_id (ou master_id)
  display_name: string;
  isMaster: boolean;
}
// --- FIM DA ADIÇÃO ---

interface TableContextType {
  tableId: string;
  masterId: string;
  userId: string;
  isMaster: boolean;
  // --- 2. ADICIONAR MEMBROS AO CONTEXTO ---
  members: TableMember[]; 
  // --- FIM DA ADIÇÃO ---
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