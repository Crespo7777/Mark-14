import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatAttributeRoll, type DiceRoll } from "@/lib/dice-parser"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface AttributeRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  attributeName: string;
  attributeValue: number;
  tableId: string;
}

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  characterName,
  attributeName,
  attributeValue,
  tableId,
}: AttributeRollDialogProps) => {
  const [modifier, setModifier] = useState("0");
  const [advantage, setAdvantage] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isMaster, masterId } = useTableContext();

  useEffect(() => {
    if (open) {
      setModifier("0");
      setAdvantage(false);
    }
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    // --- NOVO: VALIDAÇÃO DE ATRIBUTO ---
    if (attributeValue <= 0) {
        toast({ 
            title: "Regra do Sistema", 
            description: `Não é possível rolar ${attributeName} com valor ${attributeValue}.`, 
            variant: "destructive" 
        });
        return; // Bloqueia e sai da função
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const modValue = parseInt(modifier) || 0;
    
    const advantageBonus = advantage ? 2 : 0;
    const targetValue = attributeValue + modValue + advantageBonus;
    
    // Agora o parseDiceRoll retorna um objeto DiceRoll compatível com a nova engine
    const rollResult: DiceRoll | null = parseDiceRoll("1d20");
    
    if (!rollResult) { 
        toast({ title: "Erro", description: "Falha na rolagem 1d20.", variant: "destructive" });
        setLoading(false);
        return;
    }
    
    const isSuccess = rollResult.total <= targetValue && rollResult.total !== 20;
    const criticalSuccess = rollResult.total === 1;
    const criticalFailure = rollResult.total === 20;

    if (!isHidden || isMaster) {
        toast({ 
            title: isSuccess ? "Sucesso!" : "Falha!", 
            description: `Rolou ${rollResult.total} vs ${targetValue} (${attributeName}${advantage ? " +2 Adv" : ""})`,
            variant: isSuccess ? "default" : "destructive" 
        });
    }

    const chatMessage = formatAttributeRoll(characterName, attributeName, rollResult, targetValue);
    
    // Construímos o objeto para o Discord manualmente, o que garante compatibilidade
    // independentemente das mudanças internas do parser.
    const discordResult = {
        mainRoll: rollResult.total,
        advantageRoll: null,
        modifier: modValue + advantageBonus,
        totalRoll: rollResult.total,
        target: targetValue,
        isSuccess: isSuccess,
        isCrit: criticalSuccess,
        isFumble: criticalFailure
    };
    const discordRollData = { rollType: "attribute", attributeName, result: discordResult };


    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: tableId, user_id: user.id, message: `${characterName} rolou ${attributeName} em segredo.`, message_type: "info" },
        { table_id: tableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ 
          table_id: tableId, 
          user_id: user.id, 
          message: chatMessage, 
          message_type: "roll"
      });
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId: tableId, rollData: discordRollData, userName: characterName } 
      }).catch(console.error);
    }
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Teste de ${attributeName}`}
      description={`Valor base: ${attributeValue}`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Atributo"
    >
      <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="attr-mod" className="text-right">Modificador</Label>
            <Input id="attr-mod" value={modifier} onChange={(e) => setModifier(e.target.value)} className="col-span-3" placeholder="+0" type="number" />
          </div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
                <Checkbox id="attr-adv" checked={advantage} onCheckedChange={(c) => setAdvantage(!!c)} />
                <Label htmlFor="attr-adv">Vantagem (+2 no Atributo)</Label>
            </div>
          </div>
      </div>
    </BaseRollDialog>
  );
};