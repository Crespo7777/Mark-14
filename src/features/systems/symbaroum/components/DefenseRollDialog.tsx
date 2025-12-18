import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// CORREÇÃO: Importar do arquivo de dados do Symbaroum
import { rollAttributeTest, formatDefenseRoll } from "../utils/symbaroum-dice";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    if (defenseValue <= 0) {
        toast({ title: "Defesa Inválida", description: `Valor inválido (${defenseValue}).`, variant: "destructive" });
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const modValue = parseInt(modifier) || 0;
    
    // Lógica Symbaroum
    const result = rollAttributeTest({ attributeValue: defenseValue, modifier: modValue, withAdvantage: false });

    if (!isHidden || isMaster) {
      toast({ 
          title: result.isSuccess ? "Sucesso na Defesa!" : "Atingido!", 
          description: `Rolagem: ${result.totalRoll} (Alvo: ${result.target})`,
          variant: result.isSuccess ? "default" : "destructive"
      });
    }

    const chatMessage = formatDefenseRoll(characterName, result);
    const discordResult = { total: result.totalRoll, ...result };
    const discordRollData = { rollType: "defense", result: discordResult };

    const targetTableId = tableId || contextTableId;

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: targetTableId, user_id: user.id, message: `${characterName} fez um teste de Defesa em segredo.`, message_type: "info" },
        { table_id: targetTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ 
          table_id: targetTableId, user_id: user.id, message: chatMessage, message_type: "roll" 
      });
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId: targetTableId, rollData: discordRollData, userName: characterName } 
      }).catch(console.error);
    }
    
    setLoading(false);
    onOpenChange(false);
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
      actionColorClass="bg-blue-600 hover:bg-blue-700"
    >
      <div 
        className="space-y-2 mt-2"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Label htmlFor="mod-def">Modificador (no alvo)</Label>
        <Input 
            id="mod-def" 
            type="number" 
            value={modifier} 
            onChange={(e) => setModifier(e.target.value)} 
            placeholder="Ex: -2" 
            className="bg-background/50"
            onFocus={(e) => e.stopPropagation()}
        />
      </div>
    </BaseRollDialog>
  );
};