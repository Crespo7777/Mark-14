import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatDamageRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface WeaponDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  damageString: string;
  characterName: string;
  tableId: string;
}

export const WeaponDamageDialog = ({
  open,
  onOpenChange,
  weaponName,
  damageString,
  characterName,
  tableId,
}: WeaponDamageDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const baseRoll = parseDiceRoll(damageString);
    if (!baseRoll) {
      toast({ title: "Erro", description: "Dano inválido", variant: "destructive" });
      setLoading(false); return;
    }

    const advantageRoll = withAdvantage ? parseDiceRoll("1d4") : null;
    const modValue = parseInt(modifier) || 0;
    const totalDamage = baseRoll.total + (advantageRoll ? advantageRoll.total : 0) + modValue;

    if (!isHidden || isMaster) {
      toast({ title: `Dano: ${weaponName}`, description: `Total: ${totalDamage}` });
    }

    const chatMessage = formatDamageRoll(characterName, weaponName, baseRoll, advantageRoll, modValue, totalDamage);
    const discordRollData = { rollType: "damage", weaponName, baseRoll, advantageRoll, modifier: modValue, totalDamage };

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: contextTableId, user_id: user.id, message: `${characterName} rolou dano com ${weaponName} em segredo.`, message_type: "info" },
        { table_id: contextTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ 
          table_id: contextTableId, 
          user_id: user.id, 
          message: chatMessage, 
          message_type: "roll"
      });
      supabase.functions.invoke('discord-roll-handler', { body: { tableId: contextTableId, rollData: discordRollData, userName: characterName } }).catch(console.error);
    }
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Rolar Dano: ${weaponName}`}
      description={`Rolagem base: ${damageString}`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Dano"
      actionColorClass="bg-red-600 hover:bg-red-700"
    >
      <div className="flex items-center space-x-2">
        <Checkbox id="adv-dmg" checked={withAdvantage} onCheckedChange={(c) => setWithAdvantage(c as boolean)} />
        <Label htmlFor="adv-dmg">Vantagem / Crítico (+1d4)</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mod-dmg">Modificador</Label>
        <Input id="mod-dmg" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="Ex: +1" />
      </div>
    </BaseRollDialog>
  );
};