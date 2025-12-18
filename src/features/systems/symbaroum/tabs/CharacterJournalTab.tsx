// src/features/systems/symbaroum/tabs/CharacterJournalTab.tsx

import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // CORRIGIDO
import { useTableContext } from "@/features/table/TableContext";
import { SharedEntityJournalTab } from "@/components/SharedEntityJournalTab"; 

export const CharacterJournalTab = () => { 
  const { character } = useCharacterSheet();
  const { tableId } = useTableContext();

  return (
    <SharedEntityJournalTab 
        entityId={character.id} 
        entityType="character" 
        tableId={tableId} 
        isReadOnly={false} 
    />
  );
};