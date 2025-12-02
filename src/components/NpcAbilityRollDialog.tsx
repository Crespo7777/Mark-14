import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAbilityTest } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNpcSheet } from "@/features/npc/NpcSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface NpcAbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  buttonText?: string;
  tableId: string;
  characterName?: string;
  corruptionCost?: string;
  onApplyCorruption?: (val: number) => void; // Adicionei para suportar a lógica do Personagem se necessário
}

export const NpcAbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  buttonText = "Usar Habilidade",
  tableId,
  characterName,
}: NpcAbilityRollDialogProps) => {
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // Fallback para quando usado fora do contexto do NPCSheet (ex: personagem usando este componente)
  const contextNpc = tryUseNpcSheet(); 
  const nameToUse = characterName || contextNpc?.npc?.name || "NPC";
  
  const { isMaster, masterId } = useTableContext();

  // REMOVIDO: const [isHidden, setIsHidden] = useState...

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const modValue = parseInt(modifier) || 0;
    const result = rollAttributeTest({ attributeValue, modifier: modValue, withAdvantage: false });

    if (!isHidden || isMaster) {
        toast({ title: `Teste de ${abilityName}`, description: `Rolagem: ${result.totalRoll} (Alvo: ${result.target})` });
    }

    const chatMessage = formatAbilityTest(nameToUse, abilityName, attributeName, result, 0);
    const discordRollData = { rollType: "ability", abilityName, attributeName, corruptionCost: 0, result, isHidden };

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: tableId, user_id: user.id, message: `${nameToUse} usou ${abilityName} em segredo.`, message_type: "info" },
        { table_id: tableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ 
          table_id: tableId, 
          user_id: user.id, 
          message: chatMessage, 
          message_type: "roll",
          is_hidden: isHidden
      });
      supabase.functions.invoke('discord-roll-handler', { body: { tableId: tableId, rollData: discordRollData, userName: nameToUse } }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Usar: ${abilityName}`}
      description={`Teste de ${attributeName} (Alvo: ${attributeValue}).`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel={buttonText}
    >
      <div className="space-y-2">
        <Label htmlFor="mod-npc">Modificador (no alvo)</Label>
        <Input id="mod-npc" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="Ex: -2" />
      </div>
      {/* REMOVIDO: Checkbox duplicado */}
    </BaseRollDialog>
  );
};

// Helper seguro para hooks
function tryUseNpcSheet() {
    try {
        return useNpcSheet();
    } catch {
        return null;
    }
}