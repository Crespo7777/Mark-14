import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, type DiceRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

// Imports do Sistema
import { formatProtectionRoll } from "../utils/symbaroum-dice"; 
import { buildProtectionPayload } from "../utils/symbaroum-discord";

interface ProtectionRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  armorName: string;
  protectionValue: string; 
  characterName: string;
  tableId: string;
}

export const ProtectionRollDialog = ({
  open,
  onOpenChange,
  armorName,
  protectionValue,
  characterName,
  tableId,
}: ProtectionRollDialogProps) => {
  const [modifier, setModifier] = useState("0");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();

  useEffect(() => {
      if (open) setModifier("0");
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const formula = `${protectionValue}+${modifier}`;
    const rollResult: DiceRoll | null = parseDiceRoll(formula);
    
    if (!rollResult) {
        toast({ title: "Erro", description: "Valor de proteção inválido.", variant: "destructive" });
        setLoading(false);
        return;
    }

    if (!isHidden || isMaster) {
      toast({ 
          title: `Proteção: ${armorName}`, 
          description: `Absorveu ${rollResult.total} de dano.`,
          variant: "default" 
      });
    }

    const chatMessage = formatProtectionRoll(characterName, armorName, rollResult);
    const discordPayload = buildProtectionPayload(characterName, armorName, rollResult, formula);

    const targetTableId = tableId || contextTableId;

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: targetTableId, user_id: user.id, message: `${characterName} utiliza a sua armadura...`, message_type: "info" },
        { table_id: targetTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ 
          table_id: targetTableId, user_id: user.id, message: chatMessage, message_type: "roll" 
      });
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId: targetTableId, discordPayload, userName: characterName } 
      }).catch(console.error);
    }
    
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Proteção: ${armorName}`}
      description={`Valor base: ${protectionValue}`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Proteção"
      actionColorClass="bg-slate-600 hover:bg-slate-700"
    >
      <div 
        className="space-y-2 mt-2" 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Label htmlFor="mod-prot">Modificador (Extra)</Label>
        <Input 
            id="mod-prot" 
            type="number" 
            value={modifier} 
            onChange={(e) => setModifier(e.target.value)} 
            placeholder="Ex: +1 (Bênção) ou -1 (Corrosão)" 
            className="bg-background/50"
            onFocus={(e) => e.stopPropagation()}
        />
      </div>
    </BaseRollDialog>
  );
};