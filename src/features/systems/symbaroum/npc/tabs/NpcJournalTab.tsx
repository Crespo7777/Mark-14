import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext"; // <--- NOVO
import { useTableContext } from "@/features/table/TableContext";
import { SharedEntityJournalTab } from "@/components/SharedEntityJournalTab"; 

export const NpcJournalTab = () => { 
  const { npc, isReadOnly } = useSymbaroumNpcSheet(); // <--- NOVO
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