import { useState } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useFormContext } from "react-hook-form"; 
import { useToast } from "@/hooks/use-toast";
import { attributesList } from "@/features/character/character.constants";
import { NpcAbilityRollDialog } from "@/components/NpcAbilityRollDialog"; // Se tiveres um diálogo específico para NPC

// Componentes Modulares
import { NpcAbilitiesSection } from "./abilities/NpcAbilitiesSection";
import { NpcTraitsSection } from "./abilities/NpcTraitsSection";

export const NpcAbilitiesTraitsTab = () => {
  const { form, npc, isReadOnly } = useNpcSheet();
  const { getValues, setValue } = useFormContext();
  const { toast } = useToast();
  
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<any>(null);

  const handleRollClick = (index: number) => {
    const ability = form.getValues(`abilities.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === ability.associatedAttribute);

    const rawVal = allAttributes?.[selectedAttr?.key as string];
    const attributeValue = typeof rawVal === 'object' ? rawVal?.value : rawVal;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: Number(attributeValue) || 0,
      corruptionCost: String(ability.corruptionCost || "0"),
    });
  };

  const handleApplyCorruption = (amount: number) => {
      if (amount > 0) {
          const currentTemp = Number(getValues("corruption.temporary")) || 0;
          setValue("corruption.temporary", currentTemp + amount, { shouldDirty: true });
          toast({
              title: "Corrupção Aplicada",
              description: `+${amount} de corrupção temporária adicionada.`,
              variant: "destructive"
          });
      }
  };

  return (
    <div className="space-y-2 pb-10 px-1">
      
      {/* 1. Habilidades */}
      <NpcAbilitiesSection isReadOnly={isReadOnly} handleRoll={handleRollClick} />

      {/* 2. Traços */}
      <NpcTraitsSection isReadOnly={isReadOnly} />

      {/* 3. Rolagem */}
      {selectedAbilityRoll && (
        <NpcAbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => !open && setSelectedAbilityRoll(null)}
          characterName={npc.name}
          tableId={npc.table_id} 
          {...selectedAbilityRoll}
          onApplyCorruption={handleApplyCorruption} 
        />
      )}
    </div>
  );
};