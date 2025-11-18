// src/features/character/tabs/CharacterJournalTab.tsx

import { useCharacterSheet } from "../CharacterSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { SharedEntityJournalTab } from "@/components/SharedEntityJournalTab"; // <-- Importado

export const CharacterJournalTab = () => { 
  const { character } = useCharacterSheet();
  const { tableId } = useTableContext();

  return (
    <SharedEntityJournalTab 
        entityId={character.id} 
        entityType="character" 
        tableId={tableId} 
        isReadOnly={false} // O dono pode sempre editar na sua ficha
    />
  );
};