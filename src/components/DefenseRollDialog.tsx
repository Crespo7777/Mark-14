// src/components/DefenseRollDialog.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatDefenseRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface DefenseRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseValue: number;
  characterName: string;
  tableId: string;
}

export const DefenseRollDialog = ({
  open,
  onOpenChange,
  defenseValue,
  characterName,
  tableId,
}: DefenseRollDialogProps) => {
  // CORREÇÃO: Estado string
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
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

    const result = rollAttributeTest({ attributeValue: defenseValue, modifier: modValue, withAdvantage: false });

    if (!isHidden || isMaster) {
      toast({ title: "Teste de Defesa", description: `Rolagem: ${result.totalRoll} (Alvo: ${result.target})` });
    }

    const chatMessage = formatDefenseRoll(characterName, result);
    const discordRollData = { rollType: "defense", result };

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: contextTableId, user_id: user.id, message: `${characterName} fez um teste de Defesa em segredo.`, message_type: "info" },
        { table_id: contextTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ table_id: contextTableId, user_id: user.id, message: chatMessage, message_type: "roll" });
      supabase.functions.invoke('discord-roll-handler', { body: { tableId: contextTableId, rollData: discordRollData, userName: characterName } }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Teste de Defesa"
      description={`O alvo da rolagem (1d20) é ${defenseValue}.`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Defesa"
    >
      <div className="space-y-2">
        <Label htmlFor="mod-def">Modificador (no alvo)</Label>
        <Input id="mod-def" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="Ex: -2" />
      </div>
      {isMaster && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <Checkbox id="hide-def" checked={isHidden} onCheckedChange={(c) => setIsHidden(c as boolean)} />
            <Label htmlFor="hide-def" className="text-purple-400">Rolar Escondido</Label>
          </div>
        </>
      )}
    </BaseRollDialog>
  );
};