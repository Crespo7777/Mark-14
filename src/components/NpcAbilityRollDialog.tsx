// src/components/NpcAbilityRollDialog.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAbilityTest } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
}

export const NpcAbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  buttonText = "Usar Habilidade",
}: NpcAbilityRollDialogProps) => {
  // CORREÇÃO: Estado string
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { npc } = useNpcSheet();
  const { isMaster, masterId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  const handleRoll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // CORREÇÃO: Conversão
    const modValue = parseInt(modifier) || 0;

    const result = rollAttributeTest({ attributeValue, modifier: modValue, withAdvantage: false });

    if (!isHidden || isMaster) {
      toast({ title: `Teste de ${abilityName}`, description: `Rolagem: ${result.totalRoll} (Alvo: ${result.target})` });
    }

    const chatMessage = formatAbilityTest(npc.name, abilityName, attributeName, result, 0);
    const discordRollData = { rollType: "ability", abilityName, attributeName, corruptionCost: 0, result };

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: npc.table_id, user_id: user.id, message: `${npc.name} usou ${abilityName} em segredo.`, message_type: "info" },
        { table_id: npc.table_id, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ table_id: npc.table_id, user_id: user.id, message: chatMessage, message_type: "roll" });
      supabase.functions.invoke('discord-roll-handler', { body: { tableId: npc.table_id, rollData: discordRollData, userName: npc.name } }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
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
      {isMaster && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <Checkbox id="hide-npc" checked={isHidden} onCheckedChange={(c) => setIsHidden(c as boolean)} />
            <Label htmlFor="hide-npc" className="text-purple-400">Rolar Escondido</Label>
          </div>
        </>
      )}
    </BaseRollDialog>
  );
};