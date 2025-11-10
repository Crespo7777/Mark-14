// src/features/table/TableContext.tsx

import { createContext, useContext, ReactNode } from "react";

interface TableContextType {
  tableId: string;
  masterId: string; // ID do mestre da mesa
  userId: string; // ID do usuário logado
  isMaster: boolean; // O usuário logado é o mestre?
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