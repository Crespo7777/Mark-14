// src/features/npc/tabs/NpcJournalTab.tsx

import { useNpcSheet } from "../NpcSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { SharedEntityJournalTab } from "@/components/SharedEntityJournalTab"; // <-- Importado

export const NpcJournalTab = () => { 
  const { npc, isReadOnly } = useNpcSheet();
  const { tableId } = useTableContext();

  return (
    <SharedEntityJournalTab 
        entityId={npc.id} 
        entityType="npc" 
        tableId={tableId} 
        isReadOnly={isReadOnly}
    />
  );
};