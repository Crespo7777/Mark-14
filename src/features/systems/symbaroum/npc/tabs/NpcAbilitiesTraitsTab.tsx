import { useState } from "react";
// CORREÇÃO: Usar o hook do Symbaroum
import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext";
import { useFormContext } from "react-hook-form"; 
import { useToast } from "@/hooks/use-toast";
import { attributesList } from "@/features/systems/symbaroum/utils/symbaroum.constants";
import { NpcAbilityRollDialog } from "@/features/systems/symbaroum/combat/components/NpcAbilityRollDialog";

// IMPORTANTE: Certifica-te que estes arquivos existem na pasta './abilities/' dentro da nova estrutura
// Se não existirem, terás de os copiar da pasta antiga para 'src/features/systems/symbaroum/npc/tabs/abilities/'
import { NpcAbilitiesSection } from "./abilities/NpcAbilitiesSection";
import { NpcTraitsSection } from "./abilities/NpcTraitsSection";

export const NpcAbilitiesTraitsTab = () => {
  // CORREÇÃO: Hook do Symbaroum
  const { form, npc, isReadOnly } = useSymbaroumNpcSheet();
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
              description: `+${amount} de corrupção temporária adicionada ao NPC.`,
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
          npc={npc}
          attributeName={selectedAbilityRoll.attributeName} 
          abilityName={selectedAbilityRoll.abilityName}
          abilityValue={selectedAbilityRoll.attributeValue}
          corruptionCost={selectedAbilityRoll.corruptionCost}
          onApplyCorruption={handleApplyCorruption}
        />
      )}
    </div>
  );
};