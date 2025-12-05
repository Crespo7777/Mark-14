import { useState } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useFormContext } from "react-hook-form"; 
import { useToast } from "@/hooks/use-toast";
import { attributesList } from "../character.constants";
import { AbilityRollDialog } from "@/components/AbilityRollDialog";

// Secções Modulares
import { AbilitiesSection } from "./AbilitiesSection";
import { TraitsSection } from "./TraitsSection";

export const AbilitiesTraitsTab = () => {
  const { form, isReadOnly } = useCharacterSheet();
  const { getValues, setValue } = useFormContext();
  const { toast } = useToast();
  
  const [selectedAbilityRoll, setSelectedAbilityRoll] = useState<any>(null);
  const characterName = form.watch("name");

  // Lógica de Rolagem (fica aqui pois o Dialog é global à aba)
  const handleRollClick = (index: number) => {
    const ability = form.getValues(`abilities.${index}`);
    const allAttributes = form.getValues("attributes");
    const selectedAttr = attributesList.find((attr) => attr.key === ability.associatedAttribute);

    const attributeValue = selectedAttr
      ? (typeof allAttributes[selectedAttr.key] === 'object' ? allAttributes[selectedAttr.key].value : allAttributes[selectedAttr.key]) || 0
      : 0;

    setSelectedAbilityRoll({
      abilityName: ability.name || "Habilidade",
      attributeName: selectedAttr?.label || "Nenhum",
      attributeValue: Number(attributeValue),
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
      
      {/* 1. Secção de Habilidades (Amarelo) */}
      <AbilitiesSection isReadOnly={isReadOnly} handleRoll={handleRollClick} />

      {/* 2. Secção de Traços (Verde) */}
      <TraitsSection isReadOnly={isReadOnly} />

      {/* 3. Diálogo de Rolagem */}
      {selectedAbilityRoll && (
        <AbilityRollDialog
          open={!!selectedAbilityRoll}
          onOpenChange={(open) => !open && setSelectedAbilityRoll(null)}
          characterName={characterName}
          tableId={(form.getValues() as any).table_id || ""} 
          {...selectedAbilityRoll}
          onApplyCorruption={handleApplyCorruption} 
        />
      )}
    </div>
  );
};